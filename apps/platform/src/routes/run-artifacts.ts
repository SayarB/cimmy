import fs from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppDeps } from "../app.js";
import { runArtifacts, runs } from "../db/schema.js";

const ALLOWED_KINDS = new Set(["report", "transcript", "meta", "error", "events", "other_out"]);

function safeUnderRoot(root: string, candidate: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

export function runArtifactRoutes(deps: AppDeps) {
  const app = new Hono();

  app.get("/api/runs/:id/artifacts", async (c) => {
    const id = c.req.param("id");
    const runRows = await deps.db.select().from(runs).where(eq(runs.id, id)).limit(1);
    if (!runRows[0]) return c.json({ error: "not found" }, 404);

    const rows = await deps.db.select().from(runArtifacts).where(eq(runArtifacts.runId, id));
    return c.json({
      run_id: id,
      artifacts: rows.map((a) => ({
        kind: a.kind,
        size: a.size,
        content_type: a.contentType,
        url: `/api/runs/${id}/artifacts/${encodeURIComponent(a.kind)}`,
      })),
    });
  });

  app.get("/api/runs/:id/artifacts/:kind", async (c) => {
    const id = c.req.param("id");
    const kind = c.req.param("kind");
    if (!ALLOWED_KINDS.has(kind)) {
      return c.json({ error: "unsupported kind" }, 400);
    }

    const rows = await deps.db
      .select()
      .from(runArtifacts)
      .where(eq(runArtifacts.runId, id));
    const art = rows.find((a) => a.kind === kind);
    if (!art) return c.json({ error: "artifact not found" }, 404);
    if (!safeUnderRoot(deps.config.artifactsDir, art.storagePath)) {
      return c.json({ error: "invalid artifact path" }, 500);
    }

    try {
      const body = await fs.readFile(art.storagePath);
      return new Response(body, {
        headers: {
          "content-type": art.contentType || "application/octet-stream",
          "cache-control": "no-store",
        },
      });
    } catch {
      return c.json({ error: "artifact file missing" }, 404);
    }
  });

  return app;
}
