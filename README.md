# Cimmy

Repo-connected agent ops: connect GitHub → run in-repo `.cimmy` skills in ephemeral Cursor containers.

## Quick start (Mac)

```bash
cp .env.example .env
# Fixture-only (no GitHub):
./scripts/smoke-fixture-run.sh

# Real repo: follow docs/github-setup.md — set GITHUB_APP_* then:
docker build -t cimmy-cursor-runtime:local -f docker/cursor-runtime/Dockerfile .
docker compose up -d --build
open http://127.0.0.1:13000
# Sign up (CIMMY_ALLOW_SIGNUP=1), then Connect GitHub — see docs/auth-setup.md
# Login is OAuth (GitHub/Google) or email magic link — no passwords.
```

API UI: [http://127.0.0.1:13000](http://127.0.0.1:13000) (Better Auth OAuth / magic link; GitHub App still used for clone)

## Author a skill for any project

```bash
pnpm install
pnpm --filter @cimmy/create-skill build
pnpm --filter @cimmy/create-skill cli -- init daily-review --name "Daily review"
pnpm --filter @cimmy/create-skill cli -- validate
```

Cursor skill: [`skills/cimmy-author/SKILL.md`](skills/cimmy-author/SKILL.md) (also in `packages/create-cimmy-skill/SKILL.md`).

## Docs

- [Auth (Better Auth) + first user](docs/auth-setup.md)
- [UI design (ink/paper)](docs/Design.md)
- [Attach GitHub + run on Mac/VPS](docs/github-setup.md) (production: `https://cimmy.sayar.one`)
- [GitHub smoke checklist](scripts/smoke-github-run.md)

## Layout

- `apps/platform` — UI + API + worker + scheduler
- `packages/shared` — skill parse + `RunProfile`
- `packages/create-cimmy-skill` — scaffold/validate CLI + author skill
- `docker/cursor-runtime` — ephemeral run image
- `fixtures/sample-repo` — phase-1 fixture

## Trust boundary

Platform mounts the host Docker socket. Run containers never receive `DATABASE_URL` or the GitHub App private key — only a short-lived installation token for clone.
