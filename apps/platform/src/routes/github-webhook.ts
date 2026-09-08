import { createHmac, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppDeps } from "../app.js";
import { githubInstallations } from "../db/schema.js";

function verifySignature(secret: string, rawBody: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = signatureHeader.slice("sha256=".length);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(received, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Production GitHub App webhook.
 * Handles install/uninstall so we don't need a second App later.
 */
export function githubWebhookRoutes(deps: AppDeps) {
  const app = new Hono();

  app.post("/api/github/webhook", async (c) => {
    const secret = deps.config.githubWebhookSecret;
    if (!secret) {
      return c.json({ error: "GITHUB_WEBHOOK_SECRET not configured" }, 503);
    }

    const rawBody = await c.req.text();
    const signature = c.req.header("x-hub-signature-256");
    if (!verifySignature(secret, rawBody, signature)) {
      return c.json({ error: "invalid signature" }, 401);
    }

    const event = c.req.header("x-github-event") ?? "";
    const payload = JSON.parse(rawBody) as {
      action?: string;
      installation?: {
        id?: number;
        account?: { login?: string; type?: string };
      };
    };

    if (event === "installation" && payload.installation?.id) {
      const installationId = String(payload.installation.id);
      const existing = await deps.db
        .select()
        .from(githubInstallations)
        .where(eq(githubInstallations.installationId, installationId))
        .limit(1);

      if (payload.action === "deleted" || payload.action === "suspend") {
        if (existing[0]) {
          await deps.db
            .update(githubInstallations)
            .set({ suspended: 1 })
            .where(eq(githubInstallations.id, existing[0].id));
        }
      } else if (
        payload.action === "created" ||
        payload.action === "unsuspend" ||
        payload.action === "new_permissions_accepted"
      ) {
        if (existing[0]) {
          await deps.db
            .update(githubInstallations)
            .set({
              suspended: 0,
              accountLogin: payload.installation.account?.login ?? existing[0].accountLogin,
              accountType: payload.installation.account?.type ?? existing[0].accountType,
            })
            .where(eq(githubInstallations.id, existing[0].id));
        } else {
          // No session here, so we cannot know whose org this installation is.
          // Creation happens on /api/github/callback, which is authenticated.
          console.info("ignoring installation webhook for unknown installation", {
            installationId,
            action: payload.action,
          });
        }
      }
    }

    // installation_repositories / push: acknowledged for future sync; no-op for now
    return c.json({ ok: true });
  });

  return app;
}
