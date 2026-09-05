import fs from "node:fs/promises";
import path from "node:path";
import { parseSkillMd, resolveRunProfile, UnsupportedModeError } from "@cimmy/shared";

export type ValidateResult = {
  ok: boolean;
  errors: string[];
  skills: string[];
};

export async function validateSkillTree(rootDir: string): Promise<ValidateResult> {
  const cimmyDir = path.join(rootDir, ".cimmy");
  const errors: string[] = [];
  const skills: string[] = [];

  let entries: string[];
  try {
    entries = await fs.readdir(cimmyDir);
  } catch {
    return { ok: false, errors: ["Missing .cimmy/ directory"], skills: [] };
  }

  for (const name of entries) {
    const skillPath = path.join(cimmyDir, name, "SKILL.md");
    try {
      const raw = await fs.readFile(skillPath, "utf8");
      const parsed = parseSkillMd(name, raw);
      resolveRunProfile(parsed.frontmatter.mode);
      skills.push(name);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
      if (err instanceof UnsupportedModeError) {
        errors.push(`${name}: unsupported mode ${err.mode} (platform v1 only runs mode: report)`);
      } else {
        errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  if (skills.length === 0 && errors.length === 0) {
    errors.push("No .cimmy/<job-id>/SKILL.md files found");
  }

  return { ok: errors.length === 0, errors, skills };
}
