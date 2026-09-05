import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderMarkdown } from "./markdown.js";

describe("renderMarkdown", () => {
  it("renders fenced typescript as code", () => {
    const src = "```typescript\nexport function ingestJobKey(jobId: string): string {\n  return `syraa:ingest:job:${jobId}`;\n}\n```\n";
    const html = renderMarkdown(src);
    assert.match(html, /<div class="md-snippet">/);
    assert.match(html, /<span class="md-snippet-lang">typescript<\/span>/);
    assert.match(html, /<pre class="md-code"><code class="language-typescript">/);
    assert.match(html, /export function ingestJobKey/);
    assert.doesNotMatch(html, /<script/);
  });

  it("escapes raw html in prose", () => {
    const html = renderMarkdown("Hello <script>alert(1)</script>");
    assert.match(html, /&lt;script&gt;/);
    assert.doesNotMatch(html, /<script>/);
  });

  it("renders headings and bold", () => {
    const html = renderMarkdown("## Summary\n\n**bold** text");
    assert.match(html, /<h2 class="md-section">Summary<\/h2>/);
    assert.match(html, /<strong>bold<\/strong>/);
  });

  it("renders severity badges and field labels", () => {
    const src =
      "1. **AuthZ gap on status reads.** **Severity:** high **Where:** `server.ts` **Issue:** no user check **Suggestion:** scope by userId";
    const html = renderMarkdown(src);
    assert.match(html, /md-sev md-sev-high/);
    assert.match(html, /md-field-label">Severity/);
    assert.match(html, /md-field-row/);
    assert.match(html, /md-field-body/);
    assert.match(html, /md-finding-head/);
    assert.match(html, /md-finding/);
  });
});
