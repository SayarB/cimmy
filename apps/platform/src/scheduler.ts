import { DEFAULT_SKILL_CRON } from "./config.js";

export function effectiveCron(frontmatter: { schedule?: string }): string {
  return frontmatter.schedule?.trim() || DEFAULT_SKILL_CRON;
}
