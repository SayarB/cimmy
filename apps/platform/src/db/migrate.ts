import { sql } from "drizzle-orm";
import type { Db } from "./client.js";

export async function migrate(db: Db): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user" (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      email_verified boolean NOT NULL DEFAULT false,
      image text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS session (
      id text PRIMARY KEY,
      expires_at timestamptz NOT NULL,
      token text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      ip_address text,
      user_agent text,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS account (
      id text PRIMARY KEY,
      issuer text NOT NULL DEFAULT 'https://credential.invalid',
      account_id text NOT NULL,
      provider_id text NOT NULL,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token text,
      refresh_token text,
      id_token text,
      access_token_expires_at timestamptz,
      refresh_token_expires_at timestamptz,
      scope text,
      password text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    ALTER TABLE account ADD COLUMN IF NOT EXISTS issuer text NOT NULL DEFAULT 'https://credential.invalid'
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS verification (
      id text PRIMARY KEY,
      identifier text NOT NULL,
      value text NOT NULL,
      expires_at timestamptz NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS organizations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS github_installations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES organizations(id),
      installation_id text NOT NULL,
      account_login text,
      account_type text,
      suspended integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS github_installations_installation_id_uidx
      ON github_installations (installation_id)
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS enrolled_repos (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES organizations(id),
      installation_id text,
      github_repo_id text,
      full_name text NOT NULL,
      default_branch text NOT NULL DEFAULT 'main',
      enabled integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS runs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES organizations(id),
      repo_id uuid NOT NULL REFERENCES enrolled_repos(id),
      skill_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      mode text NOT NULL DEFAULT 'report',
      status text NOT NULL DEFAULT 'queued',
      trigger text NOT NULL,
      scheduled_at timestamptz,
      started_at timestamptz,
      finished_at timestamptz,
      image_digest text,
      error_summary text,
      container_id text,
      timeout_minutes integer NOT NULL DEFAULT 10,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS run_artifacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      run_id uuid NOT NULL REFERENCES runs(id),
      kind text NOT NULL,
      storage_path text NOT NULL,
      size bigint NOT NULL DEFAULT 0,
      content_type text NOT NULL DEFAULT 'application/octet-stream',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS schedule_cursors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      repo_id uuid NOT NULL REFERENCES enrolled_repos(id),
      skill_id text NOT NULL,
      cron_expr text NOT NULL,
      last_enqueued_at timestamptz
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS schedule_cursors_repo_skill_uidx
      ON schedule_cursors (repo_id, skill_id)
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS org_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'owner',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS org_members_org_user_uidx ON org_members (org_id, user_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS org_members_user_idx ON org_members (user_id)
  `);

  // Backfill: pre-existing orgs predate memberships. Attach each to the earliest
  // user so nothing is orphaned when routes start scoping by membership.
  await db.execute(sql`
    INSERT INTO org_members (org_id, user_id, role)
    SELECT o.id, u.id, 'owner'
    FROM organizations o
    CROSS JOIN LATERAL (SELECT id FROM "user" ORDER BY created_at LIMIT 1) u
    WHERE NOT EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = o.id)
    ON CONFLICT DO NOTHING
  `);
}
