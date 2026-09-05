import { html, raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";
import { APP_CSS_VERSION } from "./styles.js";

export function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type ShellOpts = {
  title: string;
  userEmail?: string | null;
  currentPath?: string;
  wide?: boolean;
  body: HtmlEscapedString | Promise<HtmlEscapedString> | string;
};

function navLink(href: string, label: string, current?: string) {
  const active = current === href || (href !== "/" && current?.startsWith(href));
  return html`<a href="${href}" ${active ? raw('aria-current="page"') : raw("")}>${label}</a>`;
}

export function shellPage(opts: ShellOpts) {
  const email = opts.userEmail ? escapeHtml(opts.userEmail) : "";
  return html`<!doctype html>
<html lang="en" data-ground="ink">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#121212" />
  <title>${escapeHtml(opts.title)} · Cimmy</title>
  <link rel="stylesheet" href="/assets/app.css?v=${APP_CSS_VERSION}" />
  <script>
    (function () {
      try {
        var g = localStorage.getItem("cimmy-ground");
        if (g === "paper" || g === "ink") document.documentElement.setAttribute("data-ground", g);
      } catch (e) {}
    })();
  </script>
</head>
<body>
  <header class="shell-header">
    <a class="brand" href="/">Cimmy</a>
    <nav class="shell-nav">
      ${navLink("/", "Repos", opts.currentPath)}
      ${navLink("/connect", "Connect", opts.currentPath)}
    </nav>
    <div class="shell-user">
      <div class="ground-toggle" role="group" aria-label="Ground">
        <button type="button" data-ground-set="ink" aria-pressed="true">ink</button>
        <button type="button" data-ground-set="paper" aria-pressed="false">paper</button>
      </div>
      ${email ? html`<span class="mono">${raw(email)}</span>` : raw("")}
      <button type="button" class="btn btn-secondary" id="btn-logout">Log out</button>
    </div>
  </header>
  <main class="shell-main${opts.wide ? " wide" : ""}">
    ${typeof opts.body === "string" ? raw(opts.body) : opts.body}
  </main>
  <script>
    (function () {
      function syncGround() {
        var g = document.documentElement.getAttribute("data-ground") || "ink";
        document.querySelectorAll("[data-ground-set]").forEach(function (btn) {
          btn.setAttribute("aria-pressed", btn.getAttribute("data-ground-set") === g ? "true" : "false");
        });
      }
      syncGround();
      document.querySelectorAll("[data-ground-set]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var g = btn.getAttribute("data-ground-set");
          document.documentElement.setAttribute("data-ground", g);
          try { localStorage.setItem("cimmy-ground", g); } catch (e) {}
          syncGround();
        });
      });
      var logout = document.getElementById("btn-logout");
      if (logout) {
        logout.addEventListener("click", async function () {
          await fetch("/api/auth/sign-out", {
            method: "POST",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: "{}",
          });
          location.href = "/login";
        });
      }
    })();
  </script>
</body>
</html>`;
}

export function authPage(opts: {
  title: string;
  providers: { github: boolean; google: boolean; magicLink: boolean };
  allowSignup: boolean;
  error?: string;
  next?: string;
  emailDelivery: "resend" | "logs";
}) {
  const next = opts.next && opts.next.startsWith("/") ? opts.next : "/";
  const hasOauth = opts.providers.github || opts.providers.google;
  const bootHint = opts.allowSignup
    ? "First sign-in creates your account."
    : "New accounts are disabled — ask an operator.";

  return html`<!doctype html>
<html lang="en" data-ground="ink">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#091c1e" />
  <title>${escapeHtml(opts.title)} · Cimmy</title>
  <link rel="stylesheet" href="/assets/app.css?v=${APP_CSS_VERSION}" />
  <script>
    (function () {
      try {
        var g = localStorage.getItem("cimmy-ground");
        if (g === "paper" || g === "ink") document.documentElement.setAttribute("data-ground", g);
      } catch (e) {}
    })();
  </script>
</head>
<body>
  <div class="auth-page">
    <div class="auth-card">
      <span class="brand">Cimmy</span>
      <p class="muted">Sign in to continue</p>
      <p class="muted" style="font-size:0.85rem">${escapeHtml(bootHint)}</p>
      ${opts.error ? html`<p class="auth-error">${escapeHtml(opts.error)}</p>` : raw("")}

      <div class="row" style="flex-direction:column;align-items:stretch;margin-top:1.25rem;gap:0.5rem">
        ${
          opts.providers.github
            ? html`<button type="button" class="btn" data-oauth="github">Continue with GitHub</button>`
            : raw("")
        }
        ${
          opts.providers.google
            ? html`<button type="button" class="btn btn-secondary" data-oauth="google">Continue with Google</button>`
            : raw("")
        }
      </div>

      ${
        !hasOauth
          ? html`<p class="muted" style="margin-top:1rem;font-size:0.85rem">No OAuth apps configured yet. Set <code>GITHUB_OAUTH_CLIENT_*</code> or <code>GOOGLE_OAUTH_CLIENT_*</code>, or use a magic link below.</p>`
          : raw("")
      }

      ${
        opts.providers.magicLink
          ? html`
      <p class="section-label" style="margin-top:1.75rem">Email</p>
      <form id="magic-form">
        <label>Work email <input name="email" type="email" autocomplete="username" required /></label>
        <p class="auth-error" id="auth-error"></p>
        <p class="muted" id="auth-ok" style="font-size:0.85rem;min-height:1.2em"></p>
        <button class="btn btn-secondary" type="submit">Email me a magic link</button>
      </form>
      <p class="auth-foot">${
        opts.emailDelivery === "resend"
          ? "Check your inbox for the link."
          : html`No mail provider — the link is printed in <code>docker compose logs platform</code>.`
      }</p>`
          : raw("")
      }
    </div>
  </div>
  <script>
    ${raw(`(function () {
      var next = ${JSON.stringify(next)};
      var err = document.getElementById("auth-error");
      var ok = document.getElementById("auth-ok");

      document.querySelectorAll("[data-oauth]").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          if (err) err.textContent = "";
          try {
            var res = await fetch("/api/auth/sign-in/social", {
              method: "POST",
              credentials: "include",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                provider: btn.getAttribute("data-oauth"),
                callbackURL: next,
              }),
            });
            var data = await res.json().catch(function () { return {}; });
            if (!res.ok) {
              if (err) err.textContent = data.message || data.error || ("OAuth failed (" + res.status + ")");
              return;
            }
            if (data.url) {
              location.href = data.url;
              return;
            }
            location.href = next;
          } catch (ex) {
            if (err) err.textContent = "Network error";
          }
        });
      });

      var form = document.getElementById("magic-form");
      if (form) {
        form.addEventListener("submit", async function (e) {
          e.preventDefault();
          if (err) err.textContent = "";
          if (ok) ok.textContent = "";
          var fd = new FormData(form);
          var email = String(fd.get("email") || "");
          try {
            var res = await fetch("/api/auth/sign-in/magic-link", {
              method: "POST",
              credentials: "include",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                email: email,
                callbackURL: next,
                name: email.split("@")[0] || "Operator",
              }),
            });
            var data = await res.json().catch(function () { return {}; });
            if (!res.ok) {
              if (err) err.textContent = data.message || data.error || ("Request failed (" + res.status + ")");
              return;
            }
            if (ok) ok.textContent = "Link sent. Check email (or platform logs on local).";
          } catch (ex) {
            if (err) err.textContent = "Network error";
          }
        });
      }
    })();`)}
  </script>
</body>
</html>`;
}
