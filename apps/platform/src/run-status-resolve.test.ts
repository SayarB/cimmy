import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveTerminalStatus } from "./run-status-resolve.js";

describe("resolveTerminalStatus", () => {
  it("marks timed_out when harvest timed out", () => {
    const r = resolveTerminalStatus({ timedOut: true, exitCode: 137, hasReport: true });
    assert.equal(r.status, "timed_out");
  });

  it("marks failed on non-zero exit", () => {
    const r = resolveTerminalStatus({ timedOut: false, exitCode: 3, hasReport: true });
    assert.equal(r.status, "failed");
  });

  it("marks succeeded when report present", () => {
    const r = resolveTerminalStatus({ timedOut: false, exitCode: 0, hasReport: true });
    assert.equal(r.status, "succeeded");
  });
});
