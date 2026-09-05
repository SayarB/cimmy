import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTranscript, renderTranscriptHtml } from "./transcript.js";

const sample = [
  JSON.stringify({
    type: "system",
    subtype: "init",
    model: "Auto",
    cwd: "/work",
  }),
  JSON.stringify({
    type: "user",
    message: { role: "user", content: [{ type: "text", text: "huge prompt" }] },
  }),
  JSON.stringify({ type: "thinking", subtype: "delta", text: "Found the " }),
  JSON.stringify({ type: "thinking", subtype: "delta", text: "function." }),
  JSON.stringify({ type: "thinking", subtype: "completed" }),
  JSON.stringify({
    type: "assistant",
    message: { role: "assistant", content: [{ type: "text", text: "Writing report." }] },
  }),
  JSON.stringify({
    type: "tool_call",
    subtype: "started",
    tool_call: {
      editToolCall: { args: { path: "/work/out/report.md" } },
    },
  }),
  JSON.stringify({
    type: "tool_call",
    subtype: "completed",
    tool_call: {
      editToolCall: {
        args: { path: "/work/out/report.md" },
        result: { success: { path: "/work/out/report.md", message: "Wrote" } },
      },
    },
  }),
  JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    result: "Done.",
  }),
].join("\n");

describe("parseTranscript", () => {
  it("coalesces thinking and skips user prompt", () => {
    const entries = parseTranscript(sample);
    assert.equal(entries.some((e) => e.kind === "meta"), true);
    assert.equal(
      entries.some((e) => e.kind === "thinking" && e.text.includes("Found the function")),
      true,
    );
    assert.equal(entries.some((e) => e.kind === "assistant"), true);
    const tool = entries.find((e) => e.kind === "tool");
    assert.ok(tool && tool.kind === "tool");
    assert.equal(tool.name, "write");
    assert.equal(tool.status, "ok");
    assert.equal(entries.some((e) => e.kind === "result" && e.ok), true);
    assert.equal(
      entries.some((e) => e.kind === "assistant" && e.text.includes("huge prompt")),
      false,
    );
  });

  it("renders without double-escaped quotes", () => {
    const html = renderTranscriptHtml(sample);
    assert.match(html, /tx-log/);
    assert.doesNotMatch(html, /&amp;quot;/);
    assert.match(html, /Writing report/);
  });
});
