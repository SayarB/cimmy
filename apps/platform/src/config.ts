/** Default skill cron when omitted — used by scheduler. */
export const DEFAULT_SKILL_CRON = "0 2 * * *";

/** Artifact retention days — sweeper in phase 3. */
export const ARTIFACT_RETENTION_DAYS = 30;

export type Config = {
  port: number;
  databaseUrl: string;
  publicUrl: string;
  enableFixtureRoutes: boolean;
  runtimeImage: string;
  artifactsDir: string;
  agentStub: boolean;
  dockerNetwork: string;
  defaultTimeoutMinutes: number;
  platformMaxTimeoutMinutes: number;
  githubAppId: string | undefined;
  githubAppPrivateKey: string | undefined;
  githubAppSlug: string | undefined;
  githubWebhookSecret: string | undefined;
  defaultOrgName: string;
  authSecret: string;
  allowSignup: boolean;
  githubOauthClientId: string | undefined;
  githubOauthClientSecret: string | undefined;
  googleOauthClientId: string | undefined;
  googleOauthClientSecret: string | undefined;
  resendApiKey: string | undefined;
  authEmailFrom: string | undefined;
};

export function getConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const privateKeyRaw = env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const privateKeyB64 = env.GITHUB_APP_PRIVATE_KEY_B64?.trim();
  let privateKey = privateKeyRaw;
  if (!privateKey && privateKeyB64) {
    privateKey = Buffer.from(privateKeyB64, "base64").toString("utf8");
  }
  const authSecret =
    env.CIMMY_AUTH_SECRET ?? "dev-only-cimmy-auth-secret-change-me";

  return {
    port: Number(env.PORT ?? 3000),
    databaseUrl,
    publicUrl: (env.CIMMY_PUBLIC_URL ?? `http://127.0.0.1:${env.PORT ?? 3000}`).replace(/\/$/, ""),
    enableFixtureRoutes: env.CIMMY_ENABLE_FIXTURE_ROUTES === "1",
    runtimeImage: env.CIMMY_RUNTIME_IMAGE ?? "cimmy-cursor-runtime:local",
    artifactsDir: env.CIMMY_ARTIFACTS_DIR ?? "/data/artifacts",
    agentStub: env.CIMMY_AGENT_STUB !== "0",
    dockerNetwork: env.CIMMY_DOCKER_NETWORK ?? "bridge",
    defaultTimeoutMinutes: Number(env.CIMMY_DEFAULT_TIMEOUT_MINUTES ?? 10),
    platformMaxTimeoutMinutes: Number(env.CIMMY_PLATFORM_MAX_TIMEOUT_MINUTES ?? 60),
    githubAppId: env.GITHUB_APP_ID,
    githubAppPrivateKey: privateKey,
    githubAppSlug: env.GITHUB_APP_SLUG,
    githubWebhookSecret: env.GITHUB_WEBHOOK_SECRET,
    defaultOrgName: env.CIMMY_DEFAULT_ORG_NAME ?? "local",
    authSecret,
    allowSignup: env.CIMMY_ALLOW_SIGNUP !== "0",
    githubOauthClientId: env.GITHUB_OAUTH_CLIENT_ID,
    githubOauthClientSecret: env.GITHUB_OAUTH_CLIENT_SECRET,
    googleOauthClientId: env.GOOGLE_OAUTH_CLIENT_ID,
    googleOauthClientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    resendApiKey: env.RESEND_API_KEY,
    authEmailFrom: env.CIMMY_AUTH_EMAIL_FROM,
  };
}

export function githubConfigured(config: Config): boolean {
  return Boolean(config.githubAppId && config.githubAppPrivateKey && config.githubAppSlug);
}
