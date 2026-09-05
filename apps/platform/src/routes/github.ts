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

    return c.redirect("/connect?connected=1");
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

  /** All repos across registered installations (for Connect UI). */
  app.get("/api/github/repos", async (c) => {
    if (!githubConfigured(deps.config)) {
      return c.json({ error: "GitHub App not configured" }, 503);
    }
    const installations = await deps.db.select().from(githubInstallations);
    const active = installations.filter((i) => i.suspended !== 1);
    const enrolled = await deps.db.select().from(enrolledRepos);
    const enrolledByGithubId = new Map(
      enrolled.filter((r) => r.githubRepoId).map((r) => [String(r.githubRepoId), r]),
    );
    const enrolledByName = new Map(enrolled.map((r) => [r.fullName.toLowerCase(), r]));

    const repos: Array<{
      id: number | string;
      fullName: string;
      defaultBranch: string;
      private: boolean;
      accountLogin: string | null;
      installationId: string;
      enrolled: boolean;
      enrolledId: string | null;
    }> = [];

    for (const inst of active) {
      const listed = await listInstallationRepos(deps.config, inst.installationId);
      for (const repo of listed) {
        const byId = enrolledByGithubId.get(String(repo.id));
        const byName = enrolledByName.get(repo.fullName.toLowerCase());
        const match = byId ?? byName ?? null;
        repos.push({
          id: repo.id,
          fullName: repo.fullName,
          defaultBranch: repo.defaultBranch,
          private: Boolean(repo.private),
          accountLogin: inst.accountLogin,
          installationId: inst.installationId,
          enrolled: Boolean(match && match.enabled === 1),
          enrolledId: match?.id ?? null,
        });
      }
    }

    repos.sort((a, b) => a.fullName.localeCompare(b.fullName));
    return c.json({
      accounts: active.map((i) => ({
        login: i.accountLogin,
        type: i.accountType,
      })),
      repos,
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
    if (!body.full_name || body.github_repo_id == null) {
      return c.json({ error: "github_repo_id and full_name required" }, 400);
    }

    let installationId = body.installation_id ? String(body.installation_id) : "";
    if (!installationId) {
      const installations = (await deps.db.select().from(githubInstallations)).filter(
        (i) => i.suspended !== 1,
      );
      for (const inst of installations) {
        const listed = await listInstallationRepos(deps.config, inst.installationId);
        if (
          listed.some(
            (r) =>
              String(r.id) === String(body.github_repo_id) ||
              r.fullName.toLowerCase() === body.full_name!.toLowerCase(),
          )
        ) {
          installationId = inst.installationId;
          break;
        }
      }
    }
    if (!installationId) {
      return c.json({ error: "repo not found on any connected GitHub account" }, 404);
    }

    const inst = await deps.db
      .select()
      .from(githubInstallations)
      .where(eq(githubInstallations.installationId, installationId))
      .limit(1);
    if (!inst[0] || inst[0].suspended === 1) {
      return c.json({ error: "GitHub account not connected" }, 400);
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
          installationId,
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
        installationId,
        githubRepoId: String(body.github_repo_id),
        fullName: body.full_name,
        defaultBranch: body.default_branch ?? "main",
        enabled: 1,
      })
      .returning();

    return c.json({ repo }, 201);
  });

  app.post("/api/repos/:id/disable", async (c) => {
    const id = c.req.param("id");
    const rows = await deps.db.select().from(enrolledRepos).where(eq(enrolledRepos.id, id)).limit(1);
    if (!rows[0]) return c.json({ error: "not found" }, 404);
    const [updated] = await deps.db
      .update(enrolledRepos)
      .set({ enabled: 0 })
      .where(eq(enrolledRepos.id, id))
      .returning();
    return c.json({ repo: updated });
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
