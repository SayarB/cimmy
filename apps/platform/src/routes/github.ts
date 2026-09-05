import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppDeps } from "../app.js";
import { githubConfigured } from "../config.js";
import { enrolledRepos, githubInstallations, runs } from "../db/schema.js";
import {
  getInstallationAccount,
  installUrl,
  listInstallationRepos,
} from "../github/app.js";
import { ensureDefaultOrg } from "../org.js";

export function githubRoutes(deps: AppDeps) {
  const app = new Hono();

  app.get("/api/github/status", (c) => {
    return c.json({
      configured: githubConfigured(deps.config),
      publicUrl: deps.config.publicUrl,
      installUrl: githubConfigured(deps.config) ? installUrl(deps.config) : null,
    });
  });

  app.get("/api/github/install", (c) => {
    if (!githubConfigured(deps.config)) {
      return c.json({ error: "GitHub App not configured" }, 503);
    }
    return c.redirect(installUrl(deps.config));
  });

  /** GitHub App setup callback: ?installation_id=…&setup_action=install */
  app.get("/api/github/callback", async (c) => {
    if (!githubConfigured(deps.config)) {
      return c.json({ error: "GitHub App not configured" }, 503);
    }
    const installationId = c.req.query("installation_id");
    if (!installationId) {
      return c.json({ error: "missing installation_id" }, 400);
    }
    const orgId = await ensureDefaultOrg(deps.db, deps.config.defaultOrgName);
    const account = await getInstallationAccount(deps.config, installationId).catch(() => null);

    const existing = await deps.db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId))
      .limit(1);

    if (existing[0]) {
      await deps.db
        .update(githubInstallations)
        .set({
          accountLogin: account?.login ?? existing[0].accountLogin,
          accountType: account?.type ?? existing[0].accountType,
          suspended: 0,
        })
        .where(eq(githubInstallations.id, existing[0].id));
    } else {
      await deps.db.insert(githubInstallations).values({
        orgId,
        installationId,
        accountLogin: account?.login ?? null,
        accountType: account?.type ?? null,
      });
    }

    return c.redirect(`/connect?installed=${encodeURIComponent(installationId)}`);
  });

  /** Dev/manual: register an installation id you already created on GitHub. */
  app.post("/api/github/installations", async (c) => {
    if (!githubConfigured(deps.config)) {
      return c.json({ error: "GitHub App not configured" }, 503);
    }
    const body = (await c.req.json()) as { installation_id?: string };
    if (!body.installation_id) {
      return c.json({ error: "installation_id required" }, 400);
    }
    const installationId = String(body.installation_id);
    const orgId = await ensureDefaultOrg(deps.db, deps.config.defaultOrgName);
    const account = await getInstallationAccount(deps.config, installationId);

    const existing = await deps.db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId))
      .limit(1);

    let row = existing[0];
    if (!row) {
      const [created] = await deps.db
        .insert(githubInstallations)
        .values({
          orgId,
          installationId,
          accountLogin: account?.login ?? null,
          accountType: account?.type ?? null,
        })
        .returning();
      row = created!;
    }

    return c.json({
      id: row.id,
      installation_id: row.installationId,
      account_login: row.accountLogin,
    });
  });

  app.get("/api/github/installations", async (c) => {
    const rows = await deps.db.select().from(githubInstallations);
    return c.json({
      installations: rows.map((r) => ({
        id: r.id,
        installation_id: r.installationId,
        account_login: r.accountLogin,
        suspended: r.suspended === 1,
      })),
    });
  });

  app.get("/api/github/installations/:installationId/repos", async (c) => {
    if (!githubConfigured(deps.config)) {
      return c.json({ error: "GitHub App not configured" }, 503);
    }
    const installationId = c.req.param("installationId");
    const repos = await listInstallationRepos(deps.config, installationId);
    return c.json({ repos });
  });

  app.post("/api/repos/enroll", async (c) => {
    if (!githubConfigured(deps.config)) {
      return c.json({ error: "GitHub App not configured" }, 503);
    }
    const body = (await c.req.json()) as {
      installation_id?: string;
      github_repo_id?: string | number;
      full_name?: string;
      default_branch?: string;
    };
    if (!body.installation_id || !body.full_name || body.github_repo_id == null) {
      return c.json({ error: "installation_id, github_repo_id, full_name required" }, 400);
    }

    const inst = await deps.db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, body.installation_id))
      .limit(1);
    if (!inst[0] || inst[0].suspended === 1) {
      return c.json({ error: "installation not registered or suspended" }, 400);
    }

    const orgId = inst[0].orgId;
    const existing = await deps.db
      .select()
      .from(enrolledRepos)
      .where(eq(enrolledRepos.fullName, body.full_name))
      .limit(1);

    if (existing[0]) {
      const [updated] = await deps.db
        .update(enrolledRepos)
        .set({
          installationId: body.installation_id,
          githubRepoId: String(body.github_repo_id),
          defaultBranch: body.default_branch ?? existing[0].defaultBranch,
          enabled: 1,
        })
        .where(eq(enrolledRepos.id, existing[0].id))
        .returning();
      return c.json({ repo: updated });
    }

    const [repo] = await deps.db
      .insert(enrolledRepos)
      .values({
        orgId,
        installationId: body.installation_id,
        githubRepoId: String(body.github_repo_id),
        fullName: body.full_name,
        defaultBranch: body.default_branch ?? "main",
        enabled: 1,
      })
      .returning();

    return c.json({ repo }, 201);
  });

  app.get("/api/repos", async (c) => {
    const rows = await deps.db.select().from(enrolledRepos);
    return c.json({
      repos: rows.map((r) => ({
        id: r.id,
        full_name: r.fullName,
        installation_id: r.installationId,
        default_branch: r.defaultBranch,
        enabled: r.enabled === 1,
      })),
    });
  });

  app.post("/api/repos/:id/runs", async (c) => {
    const id = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as { timeout_minutes?: number };
    const rows = await deps.db.select().from(enrolledRepos).where(eq(enrolledRepos.id, id)).limit(1);
    const repo = rows[0];
    if (!repo || repo.enabled !== 1) {
      return c.json({ error: "repo not found or disabled" }, 404);
    }
    if (!repo.installationId) {
      return c.json({ error: "repo has no installation_id" }, 400);
    }

    const inst = await deps.db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, repo.installationId))
      .limit(1);
    if (!inst[0] || inst[0].suspended === 1) {
      return c.json({ error: "GitHub installation missing or suspended" }, 400);
    }

    const timeoutMinutes = Math.min(
      Math.max(1, body.timeout_minutes ?? deps.config.defaultTimeoutMinutes),
      deps.config.platformMaxTimeoutMinutes,
    );

    const [run] = await deps.db
      .insert(runs)
      .values({
        orgId: repo.orgId,
        repoId: repo.id,
        skillIds: [],
        mode: "report",
        status: "queued",
        trigger: "manual",
        timeoutMinutes,
      })
      .returning();

    return c.json({ run_id: run!.id, status: run!.status }, 201);
  });

  app.get("/api/runs/:id", async (c) => {
    const id = c.req.param("id");
    const rows = await deps.db.select().from(runs).where(eq(runs.id, id)).limit(1);
    const run = rows[0];
    if (!run) return c.json({ error: "not found" }, 404);
    return c.json(run);
  });

  return app;
}
