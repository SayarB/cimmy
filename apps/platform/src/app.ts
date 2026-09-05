import { Hono } from "hono";
import { serve } from "@hono/node-server";
import type { Db } from "./db/client.js";
import type { Config } from "./config.js";
import { createAuth } from "./auth/auth.js";
import { requireAuthMiddleware, sessionMiddleware, type AuthVars } from "./auth/session.js";
import { healthRoutes } from "./routes/health.js";
import { runRoutes } from "./routes/runs.js";
import { githubRoutes } from "./routes/github.js";
import { githubWebhookRoutes } from "./routes/github-webhook.js";
import { runArtifactRoutes } from "./routes/run-artifacts.js";
import { uiRoutes } from "./routes/ui.js";

export type AppDeps = {
  db: Db;
  config: Config;
};

export function createApp(deps: AppDeps) {
  const auth = createAuth(deps.db, deps.config);
  const app = new Hono<AuthVars>();

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  app.use("*", sessionMiddleware(auth));
  app.use("*", requireAuthMiddleware());

  app.route("/", healthRoutes());
  app.route("/", runRoutes(deps));
  app.route("/", githubRoutes(deps));
  app.route("/", githubWebhookRoutes(deps));
  app.route("/", runArtifactRoutes(deps));
  app.route("/", uiRoutes(deps));

  return {
    fetch: app.fetch,
    listen(port: number) {
      return serve({ fetch: app.fetch, port });
    },
  };
}
