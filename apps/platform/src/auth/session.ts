import type { Context, Next } from "hono";
import type { Auth } from "./auth.js";

export type AuthVars = {
  Variables: {
    user: { id: string; email: string; name: string } | null;
    session: { id: string; token: string } | null;
  };
};

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/health") return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/api/github/webhook") return true;
  if (pathname.startsWith("/internal/")) return true;
  if (pathname.startsWith("/assets/")) return true;
  if (pathname === "/login" || pathname === "/signup") return true;
  return false;
}

export function sessionMiddleware(auth: Auth) {
  return async (c: Context, next: Next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    c.set("user", session?.user ?? null);
    c.set("session", session?.session ?? null);
    await next();
  };
}

/** Gate UI HTML and /api/* (except public paths). Fixture /internal stays open. */
export function requireAuthMiddleware() {
  return async (c: Context, next: Next) => {
    const path = new URL(c.req.url).pathname;
    if (isPublicPath(path)) {
      await next();
      return;
    }
    const user = c.get("user");
    if (user) {
      await next();
      return;
    }
    if (path.startsWith("/api/")) {
      return c.json({ error: "unauthorized" }, 401);
    }
    const url = new URL(c.req.url);
    const nextPath = `${url.pathname}${url.search}`;
    if (nextPath === "/" || nextPath === "") {
      return c.redirect("/login");
    }
    return c.redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  };
}
