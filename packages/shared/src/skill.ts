import { parse as parseYaml } from "yaml";
import type { SkillMode } from "./run-profile.js";

/** Default cron when skill omits `schedule` (UTC). Scheduler uses this in phase 2. */
export const DEFAULT_SKILL_CRON = "0 2 * * *";

/** Artifact retention default (days). Sweeper lands in phase 3. */
export const ARTIFACT_RETENTION_DAYS = 30;

export type SkillFrontmatter = {
  name: string;
  description?: string;
  version?: number;
  enabled?: boolean;
  schedule?: string;
  timezone?: string;
  timeout_minutes?: number;
  notify?: "always" | "findings" | "failure" | "never";
  outputs?: { report?: string };
  mode?: SkillMode;
};

export type ParsedSkill = {
  jobId: string;
  frontmatter: SkillFrontmatter;
  body: string;
};

const JOB_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseSkillMd(jobId: string, raw: string): ParsedSkill {
  if (!JOB_ID_RE.test(jobId) || jobId.length > 64) {
    throw new Error(`Invalid skill job id: ${jobId}`);
  }

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`Missing YAML frontmatter in skill ${jobId}`);
  }

  const yamlBlock = match[1] ?? "";
  const body = (match[2] ?? "").trim();
  const parsed = parseYaml(yamlBlock);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Invalid frontmatter object in skill ${jobId}`);
  }

  const fm = parsed as Record<string, unknown>;
  if (typeof fm.name !== "string" || !fm.name.trim()) {
    throw new Error(`Skill ${jobId} requires frontmatter name`);
  }

  if (fm.mode !== undefined && fm.mode !== "report" && fm.mode !== "workspace" && fm.mode !== "pr") {
    throw new Error(`Skill ${jobId} has invalid mode: ${String(fm.mode)}`);
  }

  if (fm.outputs !== undefined) {
    if (!fm.outputs || typeof fm.outputs !== "object" || Array.isArray(fm.outputs)) {
      throw new Error(`Skill ${jobId} has invalid outputs`);
    }
    const report = (fm.outputs as { report?: unknown }).report;
    if (report !== undefined) {
      if (typeof report !== "string" || report.includes("..") || report.startsWith("/")) {
        throw new Error(`Skill ${jobId} has invalid outputs.report path`);
      }
    }
  }

  const frontmatter: SkillFrontmatter = {
    name: fm.name.trim(),
    description: typeof fm.description === "string" ? fm.description : undefined,
    version: typeof fm.version === "number" ? fm.version : undefined,
    enabled: typeof fm.enabled === "boolean" ? fm.enabled : undefined,
    schedule: typeof fm.schedule === "string" ? fm.schedule : undefined,
    timezone: typeof fm.timezone === "string" ? fm.timezone : undefined,
    timeout_minutes: typeof fm.timeout_minutes === "number" ? fm.timeout_minutes : undefined,
    notify:
      fm.notify === "always" ||
      fm.notify === "findings" ||
      fm.notify === "failure" ||
      fm.notify === "never"
        ? fm.notify
        : undefined,
    outputs:
      fm.outputs && typeof fm.outputs === "object"
        ? { report: (fm.outputs as { report?: string }).report }
        : undefined,
    mode: fm.mode as SkillMode | undefined,
  };

  return { jobId, frontmatter, body };
}
