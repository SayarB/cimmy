import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import type { Config } from "../config.js";

export type InstallationToken = {
  token: string;
  expiresAt: Date;
};

export function requireGithubConfig(config: Config): {
  appId: number;
  privateKey: string;
  slug: string;
} {
  if (!config.githubAppId || !config.githubAppPrivateKey || !config.githubAppSlug) {
    throw new Error(
      "GitHub App not configured. Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, GITHUB_APP_SLUG.",
    );
  }
  return {
    appId: Number(config.githubAppId),
    privateKey: config.githubAppPrivateKey,
    slug: config.githubAppSlug,
  };
}

export function createAppOctokit(config: Config): Octokit {
  const gh = requireGithubConfig(config);
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: gh.appId,
      privateKey: gh.privateKey,
    },
  });
}

export async function createInstallationToken(
  config: Config,
  installationId: number | string,
): Promise<InstallationToken> {
  const gh = requireGithubConfig(config);
  const auth = createAppAuth({
    appId: gh.appId,
    privateKey: gh.privateKey,
  });
  const result = await auth({
    type: "installation",
    installationId: Number(installationId),
  });
  return {
    token: result.token,
    expiresAt: result.expiresAt ? new Date(result.expiresAt) : new Date(Date.now() + 3600_000),
  };
}

export async function listInstallationRepos(
  config: Config,
  installationId: number | string,
): Promise<
  Array<{
    id: number;
    fullName: string;
    defaultBranch: string;
    private: boolean;
  }>
> {
  const { token } = await createInstallationToken(config, installationId);
  const octokit = new Octokit({ auth: token });
  const reposRaw = await octokit.paginate(
    octokit.rest.apps.listReposAccessibleToInstallation,
    { per_page: 100 },
  );

  return reposRaw.map((repo) => ({
    id: repo.id,
    fullName: repo.full_name,
    defaultBranch: repo.default_branch ?? "main",
    private: Boolean(repo.private),
  }));
}

export async function getInstallationAccount(
  config: Config,
  installationId: number | string,
): Promise<{ login: string; type: string } | null> {
  const app = createAppOctokit(config);
  const { data } = await app.rest.apps.getInstallation({
    installation_id: Number(installationId),
  });
  const account = data.account as { login?: string; type?: string } | null;
  if (!account?.login) return null;
  return { login: account.login, type: account.type ?? "User" };
}

/** Read skill files from repo via Contents API (no full clone). */
export async function listCimmySkillsViaApi(
  config: Config,
  installationId: number | string,
  fullName: string,
  ref: string,
): Promise<Array<{ jobId: string; raw: string; path: string }>> {
  const { token } = await createInstallationToken(config, installationId);
  const octokit = new Octokit({ auth: token });
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) return [];

  let entries: Array<{ name: string; path: string; type: string }>;
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ".cimmy",
      ref,
    });
    if (!Array.isArray(data)) return [];
    entries = data.map((e) => ({ name: e.name, path: e.path, type: e.type }));
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 404) return [];
    throw err;
  }

  const skills: Array<{ jobId: string; raw: string; path: string }> = [];
  for (const entry of entries) {
    if (entry.type !== "dir") continue;
    const skillPath = `${entry.path}/SKILL.md`;
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: skillPath,
        ref,
      });
      if (Array.isArray(data) || data.type !== "file" || !("content" in data) || !data.content) {
        continue;
      }
      const raw = Buffer.from(data.content, "base64").toString("utf8");
      skills.push({ jobId: entry.name, raw, path: skillPath });
    } catch {
      // missing SKILL.md — skip
    }
  }
  return skills;
}

export function installUrl(config: Config): string {
  const gh = requireGithubConfig(config);
  return `https://github.com/apps/${gh.slug}/installations/new`;
}

export function cloneHttpsUrl(fullName: string): string {
  return `https://github.com/${fullName}.git`;
}
