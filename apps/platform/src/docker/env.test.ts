import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertNoPostgresCreds, buildRunContainerEnv } from "./env.js";

describe("buildRunContainerEnv", () => {
  it("sets fixture and stub flags without DATABASE_URL", () => {
    const env = buildRunContainerEnv({
      runId: "run-1",
      fixture: true,
      agentStub: true,
      timeoutMinutes: 5,
    });
    assert.equal(env.CIMMY_FIXTURE, "1");
    assert.equal(env.CIMMY_AGENT_STUB, "1");
    assert.equal(env.CIMMY_RUN_ID, "run-1");
    assert.equal(env.DATABASE_URL, undefined);
    assertNoPostgresCreds(env);
  });

  it("sets clone env for github runs without lane-A secrets", () => {
    const env = buildRunContainerEnv({
      runId: "run-2",
      fixture: false,
      agentStub: true,
      timeoutMinutes: 5,
      cloneUrl: "https://github.com/acme/repo.git",
      githubToken: "ghs_test",
      cloneRef: "main",
    });
    assert.equal(env.CIMMY_CLONE_URL, "https://github.com/acme/repo.git");
    assert.equal(env.CIMMY_GITHUB_TOKEN, "ghs_test");
    assert.equal(env.GITHUB_APP_PRIVATE_KEY, undefined);
    assertNoPostgresCreds(env);
  });

  it("rejects postgres-looking env", () => {
    assert.throws(
      () => assertNoPostgresCreds({ DATABASE_URL: "postgres://x" }),
      /DATABASE_URL/,
    );
  });

  it("rejects private key material", () => {
    assert.throws(
      () => assertNoPostgresCreds({ FOO: "-----BEGIN RSA PRIVATE KEY-----\nabc" }),
      /private key/,
    );
  });
});
