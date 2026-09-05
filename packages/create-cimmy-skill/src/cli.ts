#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { scaffoldSkill } from "./scaffold.js";
import { validateSkillTree } from "./validate.js";

function usage(): never {
  console.log(`Cimmy skill helper

Usage:
  npx @cimmy/create-skill init <job-id> [--name "Display name"] [--schedule "0 2 * * *"]
  npx @cimmy/create-skill validate [repo-root]

From this monorepo:
  pnpm --filter @cimmy/create-skill cli -- init demo-review
  pnpm --filter @cimmy/create-skill cli -- validate ../..
`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  if (!cmd || cmd === "-h" || cmd === "--help") usage();

  if (cmd === "init") {
    const jobId = args[1];
    if (!jobId) usage();
    let name = jobId;
    let schedule: string | undefined;
    for (let i = 2; i < args.length; i++) {
      if (args[i] === "--name") name = args[++i] ?? name;
      if (args[i] === "--schedule") schedule = args[++i];
    }
    const dir = path.join(process.cwd(), ".cimmy", jobId);
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, "SKILL.md");
    const body = scaffoldSkill({
      jobId,
      name,
      schedule,
      body: `Review recent changes in this repository.
Focus on correctness bugs, security issues, and broken invariants.
Write a concise report to the configured /work/out report path.
If nothing material, say so explicitly.`,
    });
    await fs.writeFile(file, body, "utf8");
    console.log(`Wrote ${file}`);
    return;
  }

  if (cmd === "validate") {
    const root = path.resolve(args[1] ?? process.cwd());
    const result = await validateSkillTree(root);
    if (result.skills.length) {
      console.log(`OK skills: ${result.skills.join(", ")}`);
    }
    if (!result.ok) {
      for (const e of result.errors) console.error(`Error: ${e}`);
      process.exit(1);
    }
    console.log("Validate passed");
    return;
  }

  usage();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
