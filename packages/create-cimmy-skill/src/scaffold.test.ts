import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { scaffoldSkill } from "./scaffold.js";
import { validateSkillTree } from "./validate.js";

describe("scaffold + validate", () => {
  it("writes parseable report skill", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cimmy-skill-"));
    const job = "demo-review";
    const raw = scaffoldSkill({
      jobId: job,
      name: "Demo review",
      body: "Do the review.",
    });
    await fs.mkdir(path.join(dir, ".cimmy", job), { recursive: true });
    await fs.writeFile(path.join(dir, ".cimmy", job, "SKILL.md"), raw);
    const result = await validateSkillTree(dir);
    assert.equal(result.ok, true);
    assert.deepEqual(result.skills, [job]);
  });

  it("fails validate on mode pr", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "cimmy-skill-"));
    const job = "bad";
    await fs.mkdir(path.join(dir, ".cimmy", job), { recursive: true });
    await fs.writeFile(
      path.join(dir, ".cimmy", job, "SKILL.md"),
      `---
name: Bad
mode: pr
---
x
`,
    );
    const result = await validateSkillTree(dir);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /unsupported mode/);
  });
});
