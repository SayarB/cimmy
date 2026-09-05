import { escapeHtml } from "./layout.js";

/**
 * Small trusted-report markdown renderer (no deps).
 * Escapes all text; only emits a fixed set of tags.
 */
export function renderMarkdown(src: string): string {
  const fences: string[] = [];
  let text = src.replace(/\r\n/g, "\n");

  text = text.replace(/```([a-zA-Z0-9_-]*)[ \t]*\n([\s\S]*?)\n?[ \t]*```/g, (_m, lang: string, code: string) => {
    const i = fences.length;
    const langLabel = lang ? escapeHtml(lang) : "";
    const langAttr = lang ? ` class="language-${langLabel}"` : "";
    const bar = langLabel
      ? `<div class="md-snippet-bar"><span class="md-snippet-lang">${langLabel}</span></div>`
      : "";
    fences.push(
      `<div class="md-snippet">${bar}<pre class="md-code"><code${langAttr}>${escapeHtml(code.replace(/\n$/, ""))}</code></pre></div>`,
    );
    return `\n\n@@FENCE${i}@@\n\n`;
  });

  const blocks = text.split(/\n{2,}/);
  const htmlParts: string[] = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block) continue;

    const fenceMatch = /^@@FENCE(\d+)@@$/.exec(block);
    if (fenceMatch) {
      htmlParts.push(fences[Number(fenceMatch[1])]!);
      continue;
    }

    if (/^#{1,3}\s/.test(block)) {
      const m = /^(#{1,3})\s+(.+)$/s.exec(block);
      if (m) {
        const level = m[1]!.length;
        htmlParts.push(`<h${level}>${inlineMd(m[2]!.trim())}</h${level}>`);
        continue;
      }
    }

    if (/^(- |\* |\d+\. )/.test(block)) {
      const lines = block.split("\n");
      const ordered = /^\d+\. /.test(lines[0]!);
      const tag = ordered ? "ol" : "ul";
      const items = lines
        .map((line) => line.replace(/^(- |\* |\d+\. )/, "").trim())
        .filter(Boolean)
        .map((item) => `<li>${inlineMd(item)}</li>`)
        .join("");
      htmlParts.push(`<${tag}>${items}</${tag}>`);
      continue;
    }

    if (/^>\s?/.test(block)) {
      const quoted = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join("\n");
      htmlParts.push(`<blockquote><p>${inlineMd(quoted)}</p></blockquote>`);
      continue;
    }

    if (/^---+$/.test(block)) {
      htmlParts.push("<hr />");
      continue;
    }

    htmlParts.push(`<p>${inlineMd(block.replace(/\n/g, " "))}</p>`);
  }

  return htmlParts.join("\n");
}

function inlineMd(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>");
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" rel="noopener noreferrer" target="_blank">$1</a>',
  );
  return out;
}
