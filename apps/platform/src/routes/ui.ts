import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { html, raw } from "hono/html";
import { desc, eq } from "drizzle-orm";
import type { AppDeps } from "../app.js";
import { githubConfigured } from "../config.js";
import { enrolledRepos, runArtifacts, runs } from "../db/schema.js";
import { authProviders } from "../auth/auth.js";
import type { AuthVars } from "../auth/session.js";
import { authPage, escapeHtml, shellPage } from "../ui/layout.js";
import { renderMarkdown } from "../ui/markdown.js";
import { APP_CSS, APP_CSS_VERSION } from "../ui/styles.js";
import { statusGlyph, statusLabel } from "../ui/status.js";
import { renderTranscriptHtml } from "../ui/transcript.js";

const FONTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/fonts",
);

const FONT_TYPES: Record<string, string> = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".otf": "font/otf",
};

function safeUnderRoot(root: string, candidate: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  return resolved === resolvedRoot || resolved.startsWith(resolvedRoot + path.sep);
}

async function readArtifactText(
  artifactsDir: string,
  storagePath: string,
): Promise<string | null> {
  if (!safeUnderRoot(artifactsDir, storagePath)) return null;
  try {
    return await fs.readFile(storagePath, "utf8");
  } catch {
    return null;
  }
}

function statusHtml(status: string) {
  const s = statusLabel(status);
  return html`<span class="status status-${s.kind}"><span aria-hidden="true">${statusGlyph(s.kind)}</span> ${s.label}</span>`;
}

function loginHtml(deps: AppDeps, next: string, error?: string) {
  const providers = authProviders(deps.config);
  return authPage({
    title: "Sign in",
    providers,
    allowSignup: deps.config.allowSignup,
    next,
    error,
    emailDelivery:
      deps.config.resendApiKey && deps.config.authEmailFrom ? "resend" : "logs",
  });
}

export function uiRoutes(deps: AppDeps) {
  const app = new Hono<AuthVars>();

  app.get("/assets/app.css", (c) => {
    return c.body(APP_CSS, 200, {
      "content-type": "text/css; charset=utf-8",
      "cache-control": "no-cache",
    });
  });

  app.get("/assets/fonts/:name", async (c) => {
    const name = c.req.param("name");
    if (!/^[\w.-]+\.(woff2|woff|otf)$/.test(name)) return c.notFound();
    const file = path.join(FONTS_DIR, name);
    if (!file.startsWith(FONTS_DIR + path.sep)) return c.notFound();
    try {
      const body = await fs.readFile(file);
      const ext = path.extname(name).toLowerCase();
      return c.body(body, 200, {
        "content-type": FONT_TYPES[ext] ?? "application/octet-stream",
        "cache-control": "public, max-age=86400",
      });
    } catch {
      return c.notFound();
    }
  });

  app.get("/login", (c) => {
    if (c.get("user")) return c.redirect("/");
    const next = c.req.query("next") || "/";
    return c.html(loginHtml(deps, next));
  });

  app.get("/signup", (c) => {
    // Password signup removed — OAuth / magic link create accounts on first use.
    return c.redirect("/login");
  });

  app.get("/", async (c) => {
    const user = c.get("user");
    const repos = await deps.db.select().from(enrolledRepos).orderBy(enrolledRepos.fullName);
    const recent = await deps.db.select().from(runs).orderBy(desc(runs.createdAt)).limit(20);
    const repoById = new Map(repos.map((r) => [r.id, r]));

    const latestByRepo = new Map<string, (typeof recent)[0]>();
    for (const run of recent) {
      if (!latestByRepo.has(run.repoId)) latestByRepo.set(run.repoId, run);
    }

    const body = html`
      <p class="section-label">Repos</p>
      <h1>Enrolled</h1>
      <p class="muted">Run skills in ephemeral containers. GitHub App still owns clone access.</p>

      ${
        repos.length === 0
          ? html`<p class="empty">No repos yet. <a href="/connect">Connect GitHub</a>.</p>`
          : html`<ul class="list" id="enrolled">
              ${repos.map((r) => {
                const last = latestByRepo.get(r.id);
                return html`<li>
                  <div class="list-meta">
                    <strong class="mono">${escapeHtml(r.fullName)}</strong>
                    ${last ? statusHtml(last.status) : html`<span class="status status-idle"><span aria-hidden="true">○</span> idle</span>`}
                  </div>
                  <div class="row">
                    ${last ? html`<a class="btn btn-secondary" href="/runs/${last.id}">Last run</a>` : raw("")}
                    <button type="button" class="btn" data-run-repo="${r.id}">Run now</button>
                  </div>
                </li>`;
              })}
            </ul>`
      }

      <p class="section-label" style="margin-top:2rem">Runs</p>
      <h1>Recent</h1>
      ${
        recent.length === 0
          ? html`<p class="empty">No runs yet.</p>`
          : html`<ul class="list">
              ${recent.map((run) => {
                const repo = repoById.get(run.repoId);
                const skills = Array.isArray(run.skillIds) ? run.skillIds.join(", ") : "";
                return html`<li>
                  <div class="list-meta">
                    <strong><a href="/runs/${run.id}" class="mono">${escapeHtml(repo?.fullName ?? run.repoId)}</a></strong>
                    <span class="muted">${statusHtml(run.status)} · ${escapeHtml(run.trigger)}${skills ? html` · ${escapeHtml(skills)}` : raw("")}</span>
                  </div>
                  <a class="btn btn-secondary" href="/runs/${run.id}">Open</a>
                </li>`;
              })}
            </ul>`
      }

      <pre class="meta" id="run-out" hidden></pre>

      <script>
        (function () {
          async function j(url, opts) {
            const r = await fetch(url, { credentials: "include", ...opts });
            const text = await r.text();
            let data;
            try { data = JSON.parse(text); } catch { data = text; }
            return { ok: r.ok, status: r.status, data };
          }
          document.querySelectorAll("[data-run-repo]").forEach(function (btn) {
            btn.addEventListener("click", async function () {
              btn.disabled = true;
              const out = document.getElementById("run-out");
              out.hidden = false;
              out.textContent = "starting…";
              const res = await j("/api/repos/" + btn.getAttribute("data-run-repo") + "/runs", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{}",
              });
              out.textContent = JSON.stringify(res.data, null, 2);
              if (res.data && res.data.run_id) {
                location.href = "/runs/" + res.data.run_id;
                return;
              }
              btn.disabled = false;
            });
          });
        })();
      </script>
    `;

    return c.html(
      shellPage({
        title: "Repos",
        userEmail: user?.email,
        currentPath: "/",
        body,
      }),
    );
  });

  app.get("/connect", async (c) => {
    const user = c.get("user");
    const configured = githubConfigured(deps.config);
    const installed = c.req.query("installed");

    const body = html`
      <p class="section-label">Connect</p>
      <h1>GitHub App</h1>
      <p class="muted">Cimmy uses a GitHub App for repo clone — not your login password.</p>

      <div class="panel">
        <p>Status: <strong>${configured ? "configured" : "not configured"}</strong></p>
        <p class="muted mono">callback ${escapeHtml(deps.config.publicUrl)}/api/github/callback</p>
        ${
          installed
            ? html`<p class="status status-done">Registered installation <code>${escapeHtml(installed)}</code></p>`
            : raw("")
        }
        <div class="row" style="margin-top:0.75rem">
          ${
            configured
              ? html`<a class="btn" href="/api/github/install">Install / Connect</a>`
              : html`<p class="muted">Set <code>GITHUB_APP_ID</code>, <code>GITHUB_APP_PRIVATE_KEY</code>, <code>GITHUB_APP_SLUG</code>.</p>`
          }
        </div>
        <div class="row" style="margin-top:0.75rem">
          <input id="manual-install-id" class="mono" placeholder="installation id" />
          <button class="btn btn-secondary" type="button" id="btn-register">Register id</button>
        </div>
      </div>

      <p class="section-label" style="margin-top:2rem">Installations</p>
      <ul class="list" id="installations"><li class="muted">Loading…</li></ul>

      <p class="section-label" style="margin-top:2rem">Repos</p>
      <div class="row">
        <input id="repos-install-id" class="mono" placeholder="installation id" />
        <button class="btn btn-secondary" type="button" id="btn-list-repos">List repos</button>
      </div>
      <ul class="list" id="repos"></ul>

      <p class="section-label" style="margin-top:2rem">Log</p>
      <pre class="meta" id="connect-out">—</pre>

      <script>
        (function () {
          async function j(url, opts) {
            const r = await fetch(url, { credentials: "include", ...opts });
            const text = await r.text();
            let data;
            try { data = JSON.parse(text); } catch { data = text; }
            return { ok: r.ok, status: r.status, data };
          }
          function out(data) {
            document.getElementById("connect-out").textContent =
              typeof data === "string" ? data : JSON.stringify(data, null, 2);
          }
          async function refreshInstallations() {
            const { data } = await j("/api/github/installations");
            const ul = document.getElementById("installations");
            ul.innerHTML = "";
            const list = data.installations || [];
            if (!list.length) {
              ul.innerHTML = '<li class="muted">None registered yet.</li>';
              return;
            }
            for (const i of list) {
              const li = document.createElement("li");
              const meta = document.createElement("div");
              meta.className = "list-meta";
              meta.innerHTML = "<strong class=\\"mono\\">" + (i.account_login || "(unknown)") + "</strong>"
                + "<span class=\\"muted mono\\">" + i.installation_id + "</span>";
              const b = document.createElement("button");
              b.className = "btn btn-secondary";
              b.type = "button";
              b.textContent = "Use";
              b.onclick = function () {
                document.getElementById("repos-install-id").value = i.installation_id;
              };
              li.appendChild(meta);
              li.appendChild(b);
              ul.appendChild(li);
            }
          }
          document.getElementById("btn-register").onclick = async function () {
            const installation_id = document.getElementById("manual-install-id").value.trim();
            const res = await j("/api/github/installations", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ installation_id }),
            });
            out(res.data);
            await refreshInstallations();
          };
          document.getElementById("btn-list-repos").onclick = async function () {
            const id = document.getElementById("repos-install-id").value.trim();
            const res = await j("/api/github/installations/" + encodeURIComponent(id) + "/repos");
            out(res.data);
            const ul = document.getElementById("repos");
            ul.innerHTML = "";
            for (const repo of (res.data.repos || [])) {
              const li = document.createElement("li");
              const meta = document.createElement("div");
              meta.className = "list-meta";
              meta.innerHTML = "<strong class=\\"mono\\">" + repo.fullName + "</strong>";
              const b = document.createElement("button");
              b.className = "btn";
              b.type = "button";
              b.textContent = "Enroll";
              b.onclick = async function () {
                const enroll = await j("/api/repos/enroll", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    installation_id: id,
                    github_repo_id: repo.id,
                    full_name: repo.fullName,
                    default_branch: repo.defaultBranch,
                  }),
                });
                out(enroll.data);
              };
              li.appendChild(meta);
              li.appendChild(b);
              ul.appendChild(li);
            }
          };
          refreshInstallations();
        })();
      </script>
    `;

    return c.html(
      shellPage({
        title: "Connect",
        userEmail: user?.email,
        currentPath: "/connect",
        body,
      }),
    );
  });

  app.get("/runs/:id", async (c) => {
    const user = c.get("user");
    const id = c.req.param("id");
    const tab = (c.req.query("tab") || "report").toLowerCase();
    const activeTab = ["report", "transcript", "meta"].includes(tab) ? tab : "report";

    const runRows = await deps.db.select().from(runs).where(eq(runs.id, id)).limit(1);
    const run = runRows[0];
    if (!run) return c.text("Run not found", 404);

    const repoRows = await deps.db
      .select()
      .from(enrolledRepos)
      .where(eq(enrolledRepos.id, run.repoId))
      .limit(1);
    const repo = repoRows[0];

    const arts = await deps.db.select().from(runArtifacts).where(eq(runArtifacts.runId, id));
    const byKind = new Map(arts.map((a) => [a.kind, a]));

    let panelText = "";
    if (activeTab === "report") {
      const art = byKind.get("report");
      panelText = art
        ? ((await readArtifactText(deps.config.artifactsDir, art.storagePath)) ?? "(report file missing)")
        : "(no report artifact)";
    } else if (activeTab === "transcript") {
      const art = byKind.get("transcript");
      panelText = art
        ? ((await readArtifactText(deps.config.artifactsDir, art.storagePath)) ?? "(transcript file missing)")
        : "(no transcript artifact)";
    } else {
      const art = byKind.get("meta");
      const rawMeta = art
        ? ((await readArtifactText(deps.config.artifactsDir, art.storagePath)) ?? null)
        : null;
      const metaObj = {
        run_id: run.id,
        status: run.status,
        trigger: run.trigger,
        mode: run.mode,
        skill_ids: run.skillIds,
        image_digest: run.imageDigest,
        error_summary: run.errorSummary,
        timeout_minutes: run.timeoutMinutes,
        started_at: run.startedAt,
        finished_at: run.finishedAt,
        artifacts: arts.map((a) => ({ kind: a.kind, size: a.size, content_type: a.contentType })),
        artifact_meta: rawMeta,
      };
      panelText = JSON.stringify(metaObj, null, 2);
    }

    const skillLabel = Array.isArray(run.skillIds) ? run.skillIds.join(", ") : "";
    const view = (c.req.query("view") || "preview").toLowerCase();
    const activeView = view === "source" ? "source" : "preview";

    let panel;
    if (activeTab === "report") {
      panel = html`
      <div class="view-toggle" role="group" aria-label="Report view">
        <a href="/runs/${id}?tab=report&view=preview" class="btn btn-secondary" ${activeView === "preview" ? raw('aria-current="page"') : raw("")}>Preview</a>
        <a href="/runs/${id}?tab=report&view=source" class="btn btn-secondary" ${activeView === "source" ? raw('aria-current="page"') : raw("")}>Source</a>
      </div>
      ${
        activeView === "preview"
          ? html`<article class="md-preview report-preview">${raw(renderMarkdown(panelText))}</article>`
          : html`<pre class="report">${raw(escapeHtml(panelText))}</pre>`
      }`;
    } else if (activeTab === "transcript") {
      panel = html`
      <div class="view-toggle" role="group" aria-label="Transcript view">
        <a href="/runs/${id}?tab=transcript&view=preview" class="btn btn-secondary" ${activeView === "preview" ? raw('aria-current="page"') : raw("")}>Preview</a>
        <a href="/runs/${id}?tab=transcript&view=source" class="btn btn-secondary" ${activeView === "source" ? raw('aria-current="page"') : raw("")}>Source</a>
      </div>
      ${
        activeView === "preview"
          ? html`<div class="tx-preview">${raw(renderTranscriptHtml(panelText))}</div>`
          : html`<pre class="transcript">${raw(escapeHtml(panelText))}</pre>`
      }`;
    } else {
      panel = html`<pre class="meta">${raw(escapeHtml(panelText))}</pre>`;
    }

    const body = html`
      <p class="section-label">Run</p>
      <h1 class="mono">${escapeHtml(repo?.fullName ?? run.repoId)}</h1>
      <p class="muted">
        ${statusHtml(run.status)}
        · trigger <code>${escapeHtml(run.trigger)}</code>
        · skills <code>${escapeHtml(skillLabel || "—")}</code>
        · id <code>${escapeHtml(id)}</code>
      </p>

      <nav class="tabs" aria-label="Run surfaces">
        <a href="/runs/${id}?tab=report" ${activeTab === "report" ? raw('aria-current="page"') : raw("")}>Report</a>
        <a href="/runs/${id}?tab=transcript" ${activeTab === "transcript" ? raw('aria-current="page"') : raw("")}>Transcript</a>
        <a href="/runs/${id}?tab=meta" ${activeTab === "meta" ? raw('aria-current="page"') : raw("")}>Meta</a>
      </nav>

      <p class="row" style="margin-bottom:0.75rem">
        <a class="btn btn-secondary" href="/api/runs/${id}/artifacts/report">Raw report</a>
        <a class="btn btn-secondary" href="/api/runs/${id}/artifacts/transcript">Raw transcript</a>
        <a class="btn btn-secondary" href="/api/runs/${id}">JSON</a>
      </p>

      ${panel}

      ${
        ["queued", "running", "starting", "pending"].includes(run.status)
          ? html`<script>
              setTimeout(function () { location.reload(); }, 2500);
            </script>`
          : raw("")
      }
    `;

    return c.html(
      shellPage({
        title: `Run ${id.slice(0, 8)}`,
        userEmail: user?.email,
        currentPath: `/runs/${id}`,
        wide: true,
        body,
      }),
    );
  });

  return app;
}
