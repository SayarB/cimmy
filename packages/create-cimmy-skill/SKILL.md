---
name: cimmy-author
description: Help engineers write Cimmy jobs (.cimmy/<job-id>/SKILL.md) that the Cimmy platform can run.
---

# Cimmy author skill

You help the user create **Cimmy** jobs for any Git repository.

## Product contract (v1)

- Jobs live only under `.cimmy/<job-id>/SKILL.md`
- `job-id` = kebab-case: `^[a-z0-9]+(?:-[a-z0-9]+)*$`, max 64 chars
- File = YAML frontmatter + markdown body (the agent prompt)
- **Platform v1 only executes `mode: report`** (or omitted `mode`, which defaults to report)
- Unsupported modes (`pr`, `workspace`) must **not** be written as if they work today — warn the user; platform fail-closes

### Required / common frontmatter

```yaml
---
name: Human display name
description: optional
enabled: true
mode: report
schedule: "0 2 * * *"   # optional; default nightly 02:00 UTC
timezone: UTC
timeout_minutes: 30
notify: findings          # always | findings | failure | never
outputs:
  report: report.md
---
```

### Body guidance

- Tell the agent what to analyze and what “good” looks like
- Instruct writing the final report under `/out/<outputs.report>`
- Do not ask the agent to `git push` or open PRs in v1
- Do not embed secrets; secrets come from Cimmy `.env` injection later

## Workflow

1. Ask what the job should do (e.g. daily commit review, dependency risk)
2. Propose a `job-id` and frontmatter
3. Write `.cimmy/<job-id>/SKILL.md`
4. Run validate when possible:
   - From Cimmy monorepo: `pnpm --filter @cimmy/create-skill cli -- validate <repo-root>`
   - Or after package publish: `npx @cimmy/create-skill validate`

## Do not

- Invent a different folder than `.cimmy/`
- Claim `mode: pr` runs on the current Cimmy platform
- Put API keys in the skill body
