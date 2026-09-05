import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const entrypoint = path.join(root, "docker/cursor-runtime/entrypoint.sh");

describe("entrypoint invoke flags", () => {
  it("agent invoke line does not include force or yolo flags", () => {
    const src = fs.readFileSync(entrypoint, "utf8");
    const agentLines = src
      .split("\n")
      .filter((line) => /^\s*agent\s/.test(line) || /^\s*agent -/.test(line));
    assert.ok(agentLines.length >= 1, "expected an agent invoke line");
    for (const line of agentLines) {
      assert.doesNotMatch(line, /--force\b/);
      assert.doesNotMatch(line, /--yolo\b/);
    }
    assert.match(src, /agent -p --trust --workspace "\$WORK_ROOT"/);
    assert.match(src, /OUT_DIR="\/work\/out"/);
    assert.match(src, /WORK_ROOT="\/work"/);
  });
});
