import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DockerRunner, HarvestResult, SpawnSpec } from "./runner.js";
import { assertNoPostgresCreds } from "./env.js";

class FakeRunner implements DockerRunner {
  lastEnv: Record<string, string> | undefined;
  constructor(private readonly result: HarvestResult) {}
  async spawn(spec: SpawnSpec) {
    assertNoPostgresCreds(spec.env);
    this.lastEnv = spec.env;
    return { containerId: "fake" };
  }
  async waitAndHarvest(): Promise<HarvestResult> {
    return this.result;
  }
  async destroy(): Promise<void> {}
}

describe("DockerRunner contract", () => {
  it("fake spawn rejects postgres env via assert", async () => {
    const runner = new FakeRunner({
      exitCode: 0,
      timedOut: true,
      files: [{ name: "report.md", data: Buffer.from("partial") }],
    });
    await assert.rejects(
      async () =>
        runner.spawn({
          runId: "r1",
          image: "x",
          env: { DATABASE_URL: "postgres://nope" },
          network: "bridge",
          timeoutMs: 1000,
        }),
      /DATABASE_URL/,
    );
  });
});
