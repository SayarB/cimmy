import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { magicLink } from "better-auth/plugins/magic-link";
import type { Db } from "../db/client.js";
import type { Config } from "../config.js";
import * as schema from "../db/schema.js";

/** Narrow surface so we do not re-export Better Auth’s deep package types. */
export type Auth = {
  handler: (request: Request) => Response | Promise<Response>;
  api: {
    getSession: (args: { headers: Headers }) => Promise<{
      user: { id: string; email: string; name: string };
      session: { id: string; token: string };
    } | null>;
  };
};

async function deliverMagicLink(
  config: Config,
  email: string,
  url: string,
): Promise<void> {
  // Always log — local/dev operators read compose logs when SMTP is unset.
  console.log(`[cimmy auth] magic link for ${email}: ${url}`);

  if (!config.resendApiKey || !config.authEmailFrom) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.resendApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: config.authEmailFrom,
      to: [email],
      subject: "Sign in to Cimmy",
      text: `Sign in to Cimmy:\n\n${url}\n\nThis link expires shortly.`,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[cimmy auth] Resend failed (${res.status}): ${body}`);
  }
}

export function createAuth(db: Db, config: Config): Auth {
  const socialProviders: Record<
    string,
    { clientId: string; clientSecret: string; disableSignUp?: boolean }
  > = {};

  if (config.githubOauthClientId && config.githubOauthClientSecret) {
    socialProviders.github = {
      clientId: config.githubOauthClientId,
      clientSecret: config.githubOauthClientSecret,
      disableSignUp: !config.allowSignup,
    };
  }
  if (config.googleOauthClientId && config.googleOauthClientSecret) {
    socialProviders.google = {
      clientId: config.googleOauthClientId,
      clientSecret: config.googleOauthClientSecret,
      disableSignUp: !config.allowSignup,
    };
  }

  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: config.authSecret,
    baseURL: config.publicUrl,
    trustedOrigins: [config.publicUrl],
    // No email/password — OAuth + magic link only.
    socialProviders,
    plugins: [
      magicLink({
        disableSignUp: !config.allowSignup,
        sendMagicLink: async ({ email, url }) => {
          await deliverMagicLink(config, email, url);
        },
      }),
    ],
  });
  return auth as unknown as Auth;
}

export function authProviders(config: Config): {
  github: boolean;
  google: boolean;
  magicLink: boolean;
} {
  return {
    github: Boolean(config.githubOauthClientId && config.githubOauthClientSecret),
    google: Boolean(config.googleOauthClientId && config.googleOauthClientSecret),
    magicLink: true,
  };
}
