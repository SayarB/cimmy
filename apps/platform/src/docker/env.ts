/**
 * Build env for cursor-runtime containers.
 * Must never include DATABASE_URL, Postgres creds, or GitHub App private key.
 */
export function buildRunContainerEnv(input: {
  runId: string;
  fixture: boolean;
  agentStub: boolean;
  timeoutMinutes: number;
  cursorApiKey?: string;
  cloneUrl?: string;
  githubToken?: string;
  cloneRef?: string;
}): Record<string, string> {
  const env: Record<string, string> = {
    CIMMY_RUN_ID: input.runId,
    CIMMY_TIMEOUT_MINUTES: String(input.timeoutMinutes),
  };

  if (input.fixture) {
    env.CIMMY_FIXTURE = "1";
  } else {
    if (!input.cloneUrl || !input.githubToken) {
      throw new Error("Non-fixture runs require cloneUrl and githubToken");
    }
    env.CIMMY_CLONE_URL = input.cloneUrl;
    env.CIMMY_GITHUB_TOKEN = input.githubToken;
    env.CIMMY_CLONE_REF = input.cloneRef ?? "HEAD";
  }
  if (input.agentStub) {
    env.CIMMY_AGENT_STUB = "1";
  }
  if (input.cursorApiKey) {
    env.CURSOR_API_KEY = input.cursorApiKey;
  }

  return env;
}

const BANNED_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PASSWORD",
  "PGPASSWORD",
  "GITHUB_APP_PRIVATE_KEY",
  "GITHUB_APP_CLIENT_SECRET",
  "CIMMY_MASTER_KEY",
];

export function assertNoPostgresCreds(env: Record<string, string>): void {
  for (const key of BANNED_KEYS) {
    if (key in env) {
      throw new Error(`Run container env must not include ${key}`);
    }
  }
  for (const [k, v] of Object.entries(env)) {
    if (/postgres/i.test(k) || /postgres:\/\//i.test(v)) {
      throw new Error(`Run container env looks like Postgres credential: ${k}`);
    }
    if (/BEGIN RSA PRIVATE KEY|BEGIN PRIVATE KEY/i.test(v)) {
      throw new Error(`Run container env must not include private key material: ${k}`);
    }
  }
}
