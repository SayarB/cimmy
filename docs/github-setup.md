# GitHub App — production-first (`cimmy.sayar.one`)

Create **one** GitHub App for production. Same App on Mac (register installation id manually if callback hits prod).

**Production base:** `https://cimmy.sayar.one`

## 1. Create the App

1. [GitHub → Settings → Developer settings → GitHub Apps](https://github.com/settings/apps) → **New GitHub App**
2. **GitHub App name**: `cimmy` (or `cimmy-sayar` if taken)
3. **Homepage URL**: `https://cimmy.sayar.one`
4. **Callback URL**: `https://cimmy.sayar.one/api/github/callback`
5. **Setup URL**: `https://cimmy.sayar.one/api/github/callback` (enable redirect on update if offered)
6. **Webhook**
   - Active: **Yes**
   - Webhook URL: `https://cimmy.sayar.one/api/github/webhook`
   - Secret: long random string → `GITHUB_WEBHOOK_SECRET` in `.env`
7. **Repository permissions**
   - **Contents**: Read-only
   - **Metadata**: Read-only
8. **Events**: `Installation`, `Installation repositories`
9. **Install on**: this account only, or any account (customers later)
10. Create → note **App ID** + **slug**
11. **Generate private key** → download `.pem`

### Fill `.env` (Mac or VPS)

```bash
GITHUB_APP_ID=…
GITHUB_APP_SLUG=…
GITHUB_WEBHOOK_SECRET=…
# ./scripts/pem-to-env-line.sh ~/Downloads/*.pem
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n…\n-----END RSA PRIVATE KEY-----\n"
```

On the **VPS**, also set:

```bash
CIMMY_PUBLIC_URL=https://cimmy.sayar.one
CIMMY_AUTH_SECRET=<long random>
CIMMY_ALLOW_SIGNUP=0
```

Sign in to the UI first ([auth-setup](auth-setup.md)); GitHub App remains for clone only.
Mac local compose can keep `CIMMY_PUBLIC_URL=http://127.0.0.1:13000` for UI links — **do not** change the GitHub App URLs to localhost.

## 2. Mac: same App, manual install id

1. Install: `https://github.com/apps/<slug>/installations/new`
2. Copy installation id from the URL / App installations page
3. Local UI → **Register installation id** → List repos → Enroll → Run now

When prod is live, installs also land via webhook/callback on `cimmy.sayar.one`.

## 3. Skill + run

```bash
pnpm --filter @cimmy/create-skill build
pnpm --filter @cimmy/create-skill cli -- init daily-review --name "Daily review"
# commit .cimmy/ on the target repo and push
```

## 4. VPS checklist

- HTTPS → `platform:3000` (Caddy/Traefik/nginx)
- DNS `cimmy.sayar.one` → VPS
- Docker socket for run containers
- Same GitHub App env vars as above + `CIMMY_PUBLIC_URL=https://cimmy.sayar.one`

## Later (`mode: pr`)

Keep Contents read-only for v1. Upgrade permissions or add a write App later — don’t add write scopes now.
