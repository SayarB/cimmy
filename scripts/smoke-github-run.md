# Manual smoke: GitHub-backed run

Use after [github-setup.md](../docs/github-setup.md).

1. `docker compose up -d --build` and health: `curl -sf http://127.0.0.1:13000/health`
2. Register installation (UI or `POST /api/github/installations`)
3. Enroll a repo that has `.cimmy/demo/SKILL.md` or another report skill
4. `POST /api/repos/:id/runs` → poll `/api/runs/:id` until terminal
5. Assert: status succeeded* (stub) or failed with clear error; container with `cimmy.run_id` gone
6. Assert: no `DATABASE_URL` in spawn path (unit tests); App private key never in run env

Optional: set a skill `schedule` to a near-term cron and wait one scheduler tick (`trigger=cron`).
