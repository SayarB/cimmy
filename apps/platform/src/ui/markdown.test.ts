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
    const html = renderMarkdown("## Title\n\n**bold** text");
    assert.match(html, /<h2>Title<\/h2>/);
    assert.match(html, /<strong>bold<\/strong>/);
  });
});
