# Auth setup (Better Auth)

Cimmy’s **UI login** uses [Better Auth](https://www.better-auth.com/) with **OAuth** (GitHub / Google) and optional **email magic link**. There is **no email/password**. This does **not** replace the GitHub App used for repo clone.

## Env

| Variable | Meaning |
|----------|---------|
| `CIMMY_AUTH_SECRET` | Session signing secret (long random in prod). |
| `CIMMY_PUBLIC_URL` | Browser origin (`http://127.0.0.1:13000` or `https://cimmy.sayar.one`). |
| `CIMMY_ALLOW_SIGNUP` | `1` (default) = first OAuth/magic-link sign-in may create a user. `0` = existing users only. |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | GitHub **OAuth App** (not the GitHub App for installs). |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client. |
| `RESEND_API_KEY` + `CIMMY_AUTH_EMAIL_FROM` | Optional — send magic links via Resend. Without these, the link is **logged** on the platform. |

### Callback URLs

Register these on each OAuth provider (must match `CIMMY_PUBLIC_URL`):

- GitHub: `{CIMMY_PUBLIC_URL}/api/auth/callback/github`
- Google: `{CIMMY_PUBLIC_URL}/api/auth/callback/google`

## Bootstrap (Mac)

1. Create a [GitHub OAuth App](https://github.com/settings/developers) (Homepage + callback above) **or** a Google OAuth client — and/or use magic link.
2. Put secrets in `.env`, `docker compose up -d --build`
3. Open http://127.0.0.1:13000 → `/login`
4. **Continue with GitHub/Google**, or request a magic link (check `docker compose logs -f platform` for the URL when Resend is unset)
5. Set `CIMMY_ALLOW_SIGNUP=0` when you want to freeze new accounts

## Bootstrap (VPS)

Same with `CIMMY_PUBLIC_URL=https://cimmy.sayar.one`, strong `CIMMY_AUTH_SECRET`, and OAuth callbacks on that host. Prefer Resend for magic links in production.

## Organizations

Every user gets **their own organization**, created automatically on first sign-in (OAuth or magic link). One user per org today; `org_members` is a join table, so multiple users per org later is a new row rather than a migration.

Everything a user can see is scoped through that membership: enrolled repos, runs, artifacts and GitHub installations. A request for another org's run or artifact returns **404**, not 403 — the route does not confirm that the id exists.

There is no longer a deployment-wide default org; `CIMMY_DEFAULT_ORG_NAME` has been removed.

### Connecting GitHub

An installation is attached to an org by the **authenticated** callback (`/api/github/callback`). The `installation` webhook has no session, so it cannot know whose org a new installation belongs to and therefore does **not** create rows — it only handles suspend / unsuspend / delete for installations that already exist. If you install the App from GitHub's directory instead of through Cimmy, it will not be listed until you open the **Connect** page, which creates it under your org.

### Upgrading an existing deployment

Migration backfills `org_members`, attaching each pre-existing organization to the earliest-created user so nothing is orphaned. On a deployment that had the old `local` org, that user inherits the existing repos and runs.

## Public vs gated

| Path | Auth |
|------|------|
| `/health` | public |
| `/api/auth/*` | public |
| `/api/github/webhook` | public (signature still required) |
| `/internal/*` | public when fixture routes enabled — **off by default** (`CIMMY_ENABLE_FIXTURE_ROUTES=0`); these routes return runs with no org filter, so only enable them locally |
| `/login`, `/assets/*` | public |
| UI + other `/api/*` | session required |

## Design

Product UI: [`docs/Design.md`](Design.md).
