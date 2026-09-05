# Design: Cimmy product UI

Source of truth for phase 3 Auth + UI. Implementors follow this doc; do not invent a second palette or denser chrome.

## Inspiration (steal the feel, not the brand)

| Source | What we take |
|--------|----------------|
| [Amp](https://ampcode.com/) | Quiet craft; warm paper / deep teal-ink dual ground; product as tabs around one unit of work (Changes / Files / Terminal → our Report / Transcript / Meta); “close the laptop, work continues.” |
| [Herdr](https://herdr.dev/) | Terminal-native density; **ink / paper** ground naming; status language (`working` · `blocked` · `idle` · `done`); sidebar list of live things; coral/warn accent for attention, not decoration. |
| [Pi](https://pi.dev/) | Typography: serif UI + Departure/Commit Mono; label letter-spacing. |

Cimmy is not a marketing site. Phase 3 ships an **authenticated console**, not a landing page with Game-of-Life heroes or logo marquees.

## Product metaphor

**A run is the unit of work** — like Amp’s orb, Herdr’s agent pane, Replicas’ replica.

- Home: enrolled repos + recent runs (list, not cards).
- Run detail: one run, three surfaces — **Report** (primary) · **Transcript** · **Meta**.
- Connect: install / enroll GitHub — sparse form, not a wizard carousel.

## Grounds (themes)

Default to **ink**. Optional **paper** toggle (Herdr-style naming).

### Ink (default)

| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#121212` | App shell (Replicas) |
| `--bg-elevated` | `#17171a` | Panels / nested surfaces (Herdr ink) |
| `--border` | `#2b2d2c` | Hairlines only |
| `--text` | `#e8e8e6` | Primary text |
| `--text-muted` | `rgba(255,255,255,0.55)` | Secondary |
| `--accent` | `#3eeba3` | Primary button, focus, success-ish (Replicas mint) |
| `--accent-ink` | `#082b24` | Text on accent fills |
| `--warn` | `#ff7a59` | Blocked / needs attention (Herdr coral family) |
| `--danger` | `#e85d5d` | Failed / destructive |
| `--shell-deep` | `#091c1e` | Optional deeper strip / login wash (Amp dark) |

### Paper (optional)

| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#fafaf8` | Shell |
| `--bg-elevated` | `#fcfcfc` | Panels |
| `--border` | `#e2e2dc` | Hairlines |
| `--text` | `#121212` | Primary |
| `--text-muted` | `rgba(18,18,18,0.55)` | Secondary |
| `--accent` | `#0d7a5f` | Darker mint for contrast on paper |
| `--accent-ink` | `#f5fff9` | Text on accent |
| `--shell-warm` | `#dfdfc1` | Login / edge wash (Amp light theme-color) |

## Typography

Inspired by [pi.dev](https://pi.dev/): **serif for UI copy**, **Departure Mono** for labels/accents, **Commit Mono** for code.

| Role | Choice | Notes |
|------|--------|-------|
| Display / product name / body | **Source Serif 4** (stand-in for pi’s Plantin MT Pro) | Editorial serif; brand “Cimmy” uses the same family at heavier weight. Plantin is proprietary — we do not bundle it. |
| Accent labels | **Departure Mono** | Section labels, status, small UI chrome (pi `--accent-mono`). |
| Code / transcript / forms | **Commit Mono** | Run IDs, paths, logs, inputs (pi `--mono`). |

Section labels: uppercase Departure Mono, ~11–12px, letter-spacing ~0.12em, muted.

Root size ~18px, body line-height ~1.55, body weight ~400–500 — matching pi’s reading density.

## Layout & chrome

- **Max content width** ~960–1120px for forms/lists; run transcript can go full available width inside the shell.
- **Header**: product name left · nav (Repos · Connect) · user + logout right. Hairline bottom border. Height ~52–60px.
- **No cards** for lists — rows with hairline separators (Herdr agent list / Amp file list).
- **No rounded-full pills**; status is text + small glyph (`●` / `◉` / `○`) or a 2px left rule, not chip clouds.
- **Buttons**: square / slight radius ≤2px; primary = accent fill; secondary = border only (Replicas).
- **Radius**: prefer `0`–`2px`. Soft large radii read as generic SaaS.
- **Shadows / glow**: none. Borders and type hierarchy only.
- **Motion**: 1–2 restrained transitions (hover opacity, tab underline). No glow pulses.

## Status vocabulary

Map run states to Herdr-style language:

| Run state | Label | Treatment |
|-----------|-------|-----------|
| queued / pending | `idle` | muted |
| running | `working` | accent or default + subtle activity |
| succeeded | `done` | muted or accent tick |
| failed / timed_out | `failed` | danger |
| needs input (future) | `blocked` | warn / coral |

## Screens (phase 3)

1. **Login** — centered, quiet; paper wash or deep Amp ink; product name dominant; email/password; no marketing copy wall.
2. **Home `/`** — enrolled repos (name, last run status, **Run now**); recent runs list below or beside.
3. **Connect `/connect`** — GitHub App install / enrollment; short steps, monospace installation ids when shown.
4. **Run detail `/runs/:id`** — header: repo · skill · status · timestamps; tabs **Report** | **Transcript** | **Meta**.

Phase 4 adds secrets/Slack settings *inside this shell* — do not redesign.

## Copy tone

Short, operator-facing, slightly dry. Prefer:

- “Run now” over “Launch your AI journey”
- “Report” over “Insights”
- “Connect GitHub” over “Integrate your workspace”

## Explicit non-goals (visual)

- Purple / indigo gradients, glow, glassmorphism
- Cream + terracotta / broadsheet newspaper layouts
- Marketing heroes, logo strips, stat grids, floating badges
- Dense multi-column dashboards
- Cloning Amp/Herdr/Replicas logos, names, or proprietary illustrations

## Implementation notes

- CSS variables on `:root` / `[data-ground="ink|paper"]`.
- Server-rendered or light HTML + one stylesheet is enough for v1; no requirement for a component library.
- Phase 3 plan validations require this file and UI tokens that match it.

## References

- https://ampcode.com/
- https://herdr.dev/
- https://replicas.dev/
- https://pi.dev/ (typography)
