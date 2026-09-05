import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

function verifySignature(secret: string, rawBody: string, signatureHeader: string): boolean {
  if (!signatureHeader.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return signatureHeader.slice("sha256=".length) === expected;
}

describe("github webhook signature shape", () => {
  it("accepts matching sha256 hmac", () => {
    const body = '{"action":"created"}';
    const secret = "test-secret";
    const sig = "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
    assert.equal(verifySignature(secret, body, sig), true);
  });

  it("rejects bad signature", () => {
    assert.equal(verifySignature("test-secret", "{}", "sha256=deadbeef"), false);
  });
});
