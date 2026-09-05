import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicPath } from "./session.js";

describe("isPublicPath", () => {
  it("allows health, auth, webhook, fixtures, assets, login", () => {
    assert.equal(isPublicPath("/health"), true);
    assert.equal(isPublicPath("/api/auth/sign-in/email"), true);
    assert.equal(isPublicPath("/api/github/webhook"), true);
    assert.equal(isPublicPath("/internal/fixture-runs"), true);
    assert.equal(isPublicPath("/assets/app.css"), true);
    assert.equal(isPublicPath("/login"), true);
    assert.equal(isPublicPath("/signup"), true);
  });

  it("blocks UI and mutating APIs", () => {
    assert.equal(isPublicPath("/"), false);
    assert.equal(isPublicPath("/runs/abc"), false);
    assert.equal(isPublicPath("/connect"), false);
    assert.equal(isPublicPath("/api/repos"), false);
    assert.equal(isPublicPath("/api/repos/enroll"), false);
    assert.equal(isPublicPath("/api/github/installations"), false);
  });
});
