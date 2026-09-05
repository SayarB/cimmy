import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { effectiveCron } from "./scheduler.js";

describe("effectiveCron", () => {
  it("defaults to nightly UTC", () => {
    assert.equal(effectiveCron({}), "0 2 * * *");
  });

  it("uses provided schedule", () => {
    assert.equal(effectiveCron({ schedule: "0 5 * * 1" }), "0 5 * * 1");
  });
});
