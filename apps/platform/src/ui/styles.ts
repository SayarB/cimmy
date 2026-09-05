/** Design tokens from docs/Design.md — served at /assets/app.css */
export const APP_CSS = `/* Cimmy — docs/Design.md (typography from pi.dev) */
@import url("https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;0,8..60,700;1,8..60,400;1,8..60,600&display=swap");

@font-face {
  font-family: "Departure Mono";
  src: url("/assets/fonts/DepartureMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Commit Mono";
  src: url("/assets/fonts/CommitMono-400-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Commit Mono";
  src: url("/assets/fonts/CommitMono-700-Regular.otf") format("opentype");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root,
[data-ground="ink"] {
  --bg: #121212;
  --bg-elevated: #17171a;
  --border: #2b2d2c;
  --text: #e8e8e6;
  --text-muted: rgba(255, 255, 255, 0.55);
  --accent: #3eeba3;
  --accent-ink: #082b24;
  --warn: #ff7a59;
  --danger: #e85d5d;
  --shell-deep: #091c1e;
  --serif: "Source Serif 4", "Plantin MT Pro", Georgia, "Times New Roman", serif;
  --mono: "Commit Mono", "SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace;
  --accent-mono: "Departure Mono", "Commit Mono", ui-monospace, Menlo, Monaco, Consolas, monospace;
  color-scheme: dark;
}

[data-ground="paper"] {
  --bg: #fafaf8;
  --bg-elevated: #fcfcfc;
  --border: #e2e2dc;
  --text: #121212;
  --text-muted: rgba(18, 18, 18, 0.55);
  --accent: #0d7a5f;
  --accent-ink: #f5fff9;
  --warn: #c45c3e;
  --danger: #b33a3a;
  --shell-deep: #dfdfc1;
  color-scheme: light;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--serif);
  font-size: 18px;
  font-weight: 400;
  line-height: 1.55;
}

a { color: var(--accent); text-decoration: none; }
a:hover { opacity: 0.85; }

.brand {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  color: var(--text);
}

.shell-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 56px;
  padding: 0 1.25rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.shell-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  margin-left: 1.5rem;
}

.shell-nav a {
  color: var(--text-muted);
  font-family: var(--accent-mono);
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: color 0.15s ease;
}
.shell-nav a:hover,
.shell-nav a[aria-current="page"] {
  color: var(--text);
}

.shell-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-muted);
  font-family: var(--accent-mono);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
}

.shell-main {
  max-width: 1040px;
  margin: 0 auto;
  padding: 1.75rem 1.25rem 3rem;
}

.shell-main.wide {
  max-width: 1200px;
}

.section-label {
  font-family: var(--accent-mono);
  font-size: 0.66rem;
  font-weight: 400;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1;
}
.section-label::before {
  content: "";
  width: 8px;
  height: 8px;
  background: var(--accent);
  flex-shrink: 0;
}

h1 {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.85rem;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0 0 0.35rem;
}

.muted { color: var(--text-muted); }
.mono, code {
  font-family: var(--mono);
  font-size: 0.84em;
}

code {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 0.1rem 0.35rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0;
  background: var(--accent);
  color: var(--accent-ink);
  font-family: var(--accent-mono);
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}
.btn:hover { opacity: 0.92; color: var(--accent-ink); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-secondary {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border);
}
.btn-secondary:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

input, select {
  min-height: 2.4rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--bg-elevated);
  color: var(--text);
  font-family: var(--mono);
  font-size: 0.9rem;
  min-width: 12rem;
}
input:focus, select:focus {
  outline: 1px solid var(--accent);
  outline-offset: 0;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--border);
}
.list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--border);
}
.list-meta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.list-meta strong {
  font-family: var(--serif);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status {
  font-family: var(--accent-mono);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.status-working { color: var(--accent); }
.status-failed { color: var(--danger); }
.status-done { color: var(--text-muted); }
.status-blocked { color: var(--warn); }

.tabs {
  display: flex;
  gap: 1.25rem;
  border-bottom: 1px solid var(--border);
  margin: 1.25rem 0 1rem;
}
.tabs a, .tabs button {
  background: none;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  padding: 0.5rem 0;
  color: var(--text-muted);
  font-family: var(--accent-mono);
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.tabs a:hover, .tabs button:hover { color: var(--text); }
.tabs a[aria-current="page"],
.tabs button[aria-current="page"] {
  color: var(--text);
  border-bottom-color: var(--accent);
}

.panel {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 1rem;
}
.panel + .panel { margin-top: 1rem; }

pre.report, pre.transcript, pre.meta {
  margin: 0;
  padding: 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--mono);
  font-size: 0.84rem;
  line-height: 1.5;
  max-height: 70vh;
  overflow: auto;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.view-toggle .btn[aria-current="page"] {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
}

.md-preview {
  margin: 0;
  padding: 1.25rem 1.35rem;
  background: var(--bg-elevated);
  border: 1px solid color-mix(in srgb, var(--text) 18%, var(--border));
  outline: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
  outline-offset: 0;
  max-height: 70vh;
  overflow: auto;
  font-family: var(--serif);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text);
}
.md-preview > *:first-child { margin-top: 0; }
.md-preview > *:last-child { margin-bottom: 0; }
.md-preview h1,
.md-preview h2,
.md-preview h3 {
  font-family: var(--serif);
  font-weight: 600;
  line-height: 1.25;
  margin: 1.25em 0 0.5em;
}
.md-preview h1 { font-size: 1.45rem; }
.md-preview h2 { font-size: 1.2rem; }
.md-preview h3 { font-size: 1.05rem; }
.md-preview p { margin: 0.75em 0; }
.md-preview ul, .md-preview ol {
  margin: 0.75em 0;
  padding-left: 1.35rem;
}
.md-preview li { margin: 0.25em 0; }
.md-preview blockquote {
  margin: 0.75em 0;
  padding-left: 0.85rem;
  border-left: 2px solid var(--border);
  color: var(--text-muted);
}
.md-preview hr {
  border: 0;
  border-top: 1px solid var(--border);
  margin: 1.25em 0;
}
.md-preview a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.md-preview code {
  font-family: var(--mono);
  font-size: 0.86em;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  padding: 0.1em 0.3em;
  border: 1px solid var(--border);
}
.md-preview .md-snippet {
  margin: 0.85em 0;
  border: 1px solid color-mix(in srgb, var(--text) 16%, var(--border));
  background: #0c0c0e;
  overflow: hidden;
}
.md-preview .md-snippet-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border-bottom: 1px solid color-mix(in srgb, var(--text) 12%, var(--border));
  background: color-mix(in srgb, var(--bg-elevated) 70%, #0c0c0e);
}
.md-preview .md-snippet-lang {
  font-family: var(--accent-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.md-preview pre.md-code {
  margin: 0;
  padding: 0.95rem 1.05rem;
  background: transparent;
  border: 0;
  overflow: auto;
  max-height: none;
}
.md-preview pre.md-code code,
.md-preview .md-snippet code {
  display: block;
  background: none;
  border: 0;
  padding: 0;
  font-family: var(--mono);
  font-size: 0.84rem;
  line-height: 1.55;
  white-space: pre;
  color: #e6e6e2;
  tab-size: 2;
}

html[data-ground="paper"] .md-preview .md-snippet {
  background: #f3f3ef;
}
html[data-ground="paper"] .md-preview .md-snippet-bar {
  background: color-mix(in srgb, var(--bg-elevated) 80%, #ecece6);
}
html[data-ground="paper"] .md-preview pre.md-code code,
html[data-ground="paper"] .md-preview .md-snippet code {
  color: var(--text);
}

.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background:
    radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--shell-deep) 80%, transparent), transparent 55%),
    var(--bg);
}

.auth-card {
  width: min(100%, 360px);
}
.auth-card .brand {
  font-size: 2.25rem;
  margin-bottom: 0.25rem;
  display: block;
}
.auth-card form {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 1.5rem;
}
.auth-card label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-family: var(--accent-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.auth-card input { width: 100%; min-width: 0; }
.auth-card .btn { width: 100%; margin-top: 0.35rem; }
.auth-error {
  color: var(--danger);
  font-size: 0.9rem;
  min-height: 1.2em;
  font-family: var(--serif);
}
.auth-foot {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.ground-toggle {
  display: inline-flex;
  border: 1px solid var(--border);
}
.ground-toggle button {
  background: transparent;
  border: 0;
  color: var(--text-muted);
  font-family: var(--accent-mono);
  font-size: 0.66rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.45rem;
  cursor: pointer;
}
.ground-toggle button[aria-pressed="true"] {
  background: var(--bg-elevated);
  color: var(--text);
}

.empty {
  color: var(--text-muted);
  padding: 0.75rem 0;
  border-top: 1px solid var(--border);
}
`;
