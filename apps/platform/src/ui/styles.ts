/** Design tokens from docs/Design.md — served at /assets/app.css */
export const APP_CSS_VERSION = "20260905f";
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

/* Inline chips only — never style multi-line <pre><code> as chips (paints per line). */
:not(pre) > code {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 0.1rem 0.35rem;
}
pre code {
  display: block;
  background: none;
  border: 0;
  padding: 0;
  font-size: inherit;
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
  padding: 1.5rem 1.65rem 1.85rem;
  background: var(--bg-elevated);
  border: 1px solid #3a3c3b;
  max-height: 70vh;
  overflow: auto;
  font-family: var(--serif);
  font-size: 0.98rem;
  line-height: 1.75;
  color: rgba(232, 232, 230, 0.72);
}
.md-preview > *:first-child { margin-top: 0; }
.md-preview > *:last-child { margin-bottom: 0; }

.md-preview h1.md-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.55rem;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin: 0 0 1.15rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #3a3c3b;
  color: rgba(232, 232, 230, 0.92);
}
.md-preview h2.md-section {
  font-family: var(--accent-mono);
  font-weight: 400;
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 2.1rem 0 1rem;
  padding: 0;
  border: 0;
}
.md-preview h3.md-finding-title {
  font-family: var(--serif);
  font-weight: 600;
  font-size: 1.08rem;
  line-height: 1.35;
  margin: 1.6rem 0 0.75rem;
  padding-left: 0.75rem;
  border-left: 2px solid var(--accent);
  color: rgba(232, 232, 230, 0.9);
}

.md-preview p {
  margin: 0.85em 0;
  color: rgba(232, 232, 230, 0.68);
}
.md-preview strong {
  color: rgba(232, 232, 230, 0.88);
  font-weight: 600;
}
.md-preview em {
  color: rgba(232, 232, 230, 0.75);
}

.md-preview ul.md-bullets,
.md-preview ol.md-findings {
  margin: 0.5rem 0 0.25rem;
  padding: 0;
  list-style: none;
  counter-reset: finding;
}
.md-preview ul.md-bullets > li {
  position: relative;
  margin: 0.65rem 0;
  padding-left: 1.15rem;
  color: rgba(232, 232, 230, 0.7);
  line-height: 1.7;
}
.md-preview ul.md-bullets > li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 5px;
  height: 5px;
  background: color-mix(in srgb, var(--accent) 70%, transparent);
}

.md-preview ol.md-findings > li {
  counter-increment: finding;
  display: block;
  margin: 0 0 1.25rem;
  padding: 1.15rem 1.2rem 1.25rem;
  background: rgba(12, 12, 14, 0.55);
  border: 1px solid #2f3130;
  border-left: 3px solid color-mix(in srgb, var(--accent) 40%, #2f3130);
}
.md-preview ol.md-findings > li:last-child {
  margin-bottom: 0.25rem;
}
.md-preview ol.md-findings > li:has(.md-sev-high) {
  border-left-color: color-mix(in srgb, var(--danger) 75%, #2f3130);
}
.md-preview ol.md-findings > li:has(.md-sev-medium) {
  border-left-color: color-mix(in srgb, var(--warn) 75%, #2f3130);
}
.md-preview ol.md-findings > li:has(.md-sev-low) {
  border-left-color: color-mix(in srgb, var(--accent) 65%, #2f3130);
}
.md-preview ol.md-findings > li::before {
  content: counter(finding);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.4rem;
  margin: 0 0.65rem 0.85rem 0;
  padding: 0 0.35rem;
  border: 1px solid #343636;
  background: rgba(18, 18, 18, 0.9);
  color: color-mix(in srgb, var(--accent) 85%, #fff);
  font-family: var(--accent-mono);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  vertical-align: middle;
}

.md-preview .md-finding-head {
  display: block;
  margin: 0 0 1rem;
  font-family: var(--serif);
  font-size: 1.06rem;
  font-weight: 600;
  line-height: 1.4;
  color: rgba(232, 232, 230, 0.9);
}
.md-preview .md-finding-head strong {
  color: inherit;
  font-weight: 600;
}

.md-preview .md-field-row {
  display: block;
  margin: 0 0 0.95rem;
  padding: 0;
}
.md-preview .md-field-row:last-child {
  margin-bottom: 0;
}
.md-preview .md-field-label {
  display: block;
  margin: 0 0 0.35rem;
  font-family: var(--accent-mono);
  font-size: 0.64rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(232, 232, 230, 0.38);
}
.md-preview .md-field-body {
  display: block;
  margin: 0;
  color: rgba(232, 232, 230, 0.68);
  line-height: 1.7;
}
.md-preview .md-field-sev {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1.05rem;
}
.md-preview .md-field-sev .md-field-label {
  display: inline-block;
  margin: 0;
}
.md-preview .md-sev {
  display: inline-block;
  padding: 0.18rem 0.5rem;
  border: 1px solid transparent;
  font-family: var(--accent-mono);
  font-size: 0.64rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.md-preview .md-sev-high {
  color: #f0b4b4;
  background: color-mix(in srgb, var(--danger) 16%, transparent);
  border-color: color-mix(in srgb, var(--danger) 40%, transparent);
}
.md-preview .md-sev-medium {
  color: #efc4b0;
  background: color-mix(in srgb, var(--warn) 14%, transparent);
  border-color: color-mix(in srgb, var(--warn) 38%, transparent);
}
.md-preview .md-sev-low {
  color: #a8e6cc;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
  border-color: color-mix(in srgb, var(--accent) 32%, transparent);
}

.md-preview blockquote {
  margin: 1em 0;
  padding: 0.7rem 0 0.7rem 1rem;
  border-left: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
  color: rgba(232, 232, 230, 0.55);
  background: rgba(12, 12, 14, 0.35);
}
.md-preview hr {
  border: 0;
  border-top: 1px solid #2f3130;
  margin: 1.75em 0;
}
.md-preview a {
  color: color-mix(in srgb, var(--accent) 85%, #fff);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.md-preview :not(pre) > code {
  font-family: var(--mono);
  font-size: 0.82em;
  color: #9fdcc0;
  background: rgba(62, 235, 163, 0.06);
  padding: 0.15em 0.4em;
  border: 1px solid rgba(62, 235, 163, 0.14);
}
.md-preview .md-snippet {
  margin: 1.1em 0;
  border: 1px solid #2f3130;
  background: #0a0a0b;
  overflow: hidden;
}
.md-preview .md-snippet:first-child { margin-top: 0; }
.md-preview .md-snippet:last-child { margin-bottom: 0; }
.md-preview .md-snippet-bar {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.95rem;
  border-bottom: 1px solid #2a2c2b;
  background: #121214;
}
.md-preview .md-snippet-lang {
  font-family: var(--accent-mono);
  font-size: 0.64rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(232, 232, 230, 0.4);
}
.md-preview pre.md-code {
  margin: 0;
  padding: 1.05rem 1.1rem;
  background: transparent;
  border: 0;
  overflow: auto;
  max-height: none;
  white-space: pre;
}
.md-preview pre.md-code code {
  display: block;
  background: none !important;
  border: 0 !important;
  padding: 0 !important;
  font-family: var(--mono);
  font-size: 0.84rem;
  line-height: 1.6;
  white-space: pre;
  color: rgba(230, 230, 226, 0.82);
  tab-size: 2;
}

html[data-ground="paper"] .md-preview {
  border-color: #cfcfc8;
  color: rgba(18, 18, 18, 0.72);
}
html[data-ground="paper"] .md-preview h1.md-title {
  border-bottom-color: #cfcfc8;
  color: rgba(18, 18, 18, 0.92);
}
html[data-ground="paper"] .md-preview p,
html[data-ground="paper"] .md-preview .md-field-body,
html[data-ground="paper"] .md-preview ul.md-bullets > li {
  color: rgba(18, 18, 18, 0.72);
}
html[data-ground="paper"] .md-preview .md-finding-head,
html[data-ground="paper"] .md-preview strong {
  color: rgba(18, 18, 18, 0.9);
}
html[data-ground="paper"] .md-preview .md-field-label {
  color: rgba(18, 18, 18, 0.42);
}
html[data-ground="paper"] .md-preview :not(pre) > code {
  color: #0a5c45;
  background: color-mix(in srgb, var(--accent) 8%, #fff);
  border-color: color-mix(in srgb, var(--accent) 18%, var(--border));
}
html[data-ground="paper"] .md-preview ol.md-findings > li {
  background: #f4f4f0;
  border-color: #d8d8d0;
}
html[data-ground="paper"] .md-preview .md-sev-high {
  color: #8a1f1f;
}
html[data-ground="paper"] .md-preview .md-sev-medium {
  color: #8a3d1f;
}
html[data-ground="paper"] .md-preview .md-sev-low {
  color: #0a5c45;
}
html[data-ground="paper"] .md-preview .md-snippet {
  background: #f4f4f0;
  border-color: #cfcfc8;
}
html[data-ground="paper"] .md-preview .md-snippet-bar {
  background: #ecece6;
  border-bottom-color: #d8d8d0;
}
html[data-ground="paper"] .md-preview pre.md-code code {
  color: rgba(18, 18, 18, 0.82);
}

.tx-preview {
  margin: 0;
  padding: 0.35rem 0;
  background: var(--bg-elevated);
  border: 1px solid #3a3c3b;
  max-height: 70vh;
  overflow: auto;
}
.tx-log {
  list-style: none;
  margin: 0;
  padding: 0;
}
.tx-log > li {
  padding: 0.75rem 1.1rem;
  border-bottom: 1px solid var(--border);
}
.tx-log > li:last-child { border-bottom: 0; }
.tx-label {
  display: inline-block;
  font-family: var(--accent-mono);
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}
.tx-status {
  float: right;
  font-family: var(--accent-mono);
  font-size: 0.66rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.tx-tool.tx-ok .tx-status { color: var(--accent); }
.tx-tool.tx-rejected .tx-status,
.tx-tool.tx-error .tx-status,
.tx-result.tx-error .tx-status { color: var(--danger); }
.tx-body {
  margin: 0.35rem 0 0;
  font-family: var(--serif);
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}
.tx-thinking .tx-body {
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--text-muted);
  background: none;
  border: 0;
  padding: 0;
  max-height: none;
  overflow: visible;
}
.tx-meta .tx-body {
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--text-muted);
}
.tx-tool .tx-body {
  font-family: var(--mono);
  font-size: 0.82rem;
  color: var(--text-muted);
}
.tx-result.tx-ok {
  border-left: 2px solid var(--accent);
}
.tx-result.tx-error {
  border-left: 2px solid var(--danger);
}

.flash {
  margin-top: 1rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  font-family: var(--mono);
  font-size: 0.84rem;
  color: var(--text);
}
.flash-error {
  border-color: color-mix(in srgb, var(--danger) 50%, var(--border));
  color: var(--danger);
}

.repo-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-top: 2rem;
}
.repo-toolbar .section-label { margin: 0; }
#repo-search {
  flex: 1 1 16rem;
  min-width: 12rem;
  max-width: 28rem;
}
.connect-hero {
  margin-top: 1rem;
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
