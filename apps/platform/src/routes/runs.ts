import { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { AppDeps } from "../app.js";
import { runs } from "../db/schema.js";
import { seedFixture } from "../db/seed.js";

export function runRoutes(deps: AppDeps) {
  const app = new Hono();

  app.post("/internal/fixture-runs", async (c) => {
    if (!deps.config.enableFixtureRoutes) {
      return c.json({ error: "fixture routes disabled" }, 403);
    }

    const body = (await c.req.json().catch(() => ({}))) as {
      timeout_minutes?: number;
    };

    const { orgId, repoId } = await seedFixture(deps.db);
    const timeoutMinutes = Math.min(
      Math.max(1, body.timeout_minutes ?? deps.config.defaultTimeoutMinutes),
      deps.config.platformMaxTimeoutMinutes,
    );

    const [run] = await deps.db
      .insert(runs)
      .values({
        orgId,
        repoId,
        skillIds: [],
        mode: "report",
        status: "queued",
        trigger: "fixture",
        timeoutMinutes,
      })
      .returning();

    return c.json({ run_id: run!.id, status: run!.status }, 201);
  });

  app.get("/internal/runs/:id", async (c) => {
    if (!deps.config.enableFixtureRoutes) {
      return c.json({ error: "fixture routes disabled" }, 403);
    }
    const id = c.req.param("id");
    const rows = await deps.db.select().from(runs).where(eq(runs.id, id)).limit(1);
    const run = rows[0];
    if (!run) {
      return c.json({ error: "not found" }, 404);
    }
    return c.json(run);
  });

  return app;
}
