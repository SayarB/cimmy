import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UnsupportedModeError, resolveRunProfile } from "./run-profile.js";
import { parseSkillMd } from "./skill.js";

describe("resolveRunProfile", () => {
  it("returns report profile for undefined and report", () => {
    assert.equal(resolveRunProfile(undefined).mode, "report");
    assert.equal(resolveRunProfile("report").mode, "report");
    assert.equal(resolveRunProfile("report").allowForceCli, false);
  });

  it("fails closed on pr mode", () => {
    assert.throws(() => resolveRunProfile("pr"), UnsupportedModeError);
  });

  it("fails closed on workspace mode", () => {
    assert.throws(() => resolveRunProfile("workspace"), UnsupportedModeError);
  });
});

describe("parseSkillMd", () => {
  it("parses valid skill", () => {
    const raw = `---
name: Demo report
enabled: true
mode: report
outputs:
  report: report.md
---
Do the thing.
`;
    const skill = parseSkillMd("demo", raw);
    assert.equal(skill.jobId, "demo");
    assert.equal(skill.frontmatter.name, "Demo report");
    assert.equal(skill.frontmatter.mode, "report");
    assert.equal(skill.frontmatter.outputs?.report, "report.md");
    assert.match(skill.body, /Do the thing/);
  });

  it("rejects missing frontmatter", () => {
    assert.throws(() => parseSkillMd("demo", "no frontmatter"), /frontmatter/);
  });

  it("rejects path traversal in outputs.report", () => {
    const raw = `---
name: Bad
outputs:
  report: ../secret
---
x
`;
    assert.throws(() => parseSkillMd("demo", raw), /outputs.report/);
  });
});
