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
        const title = decorateInline(inlineMd(m[2]!.trim()));
        if (level === 1) {
          htmlParts.push(`<h1 class="md-title">${title}</h1>`);
        } else if (level === 2) {
          htmlParts.push(`<h2 class="md-section">${title}</h2>`);
        } else {
          htmlParts.push(`<h3 class="md-finding-title">${title}</h3>`);
        }
        continue;
      }
    }

    if (/^(- |\* |\d+\. )/.test(block)) {
      htmlParts.push(renderListBlock(block));
      continue;
    }

    if (/^>\s?/.test(block)) {
      const quoted = block
        .split("\n")
        .map((l) => l.replace(/^>\s?/, ""))
        .join("\n");
      htmlParts.push(`<blockquote><p>${decorateInline(inlineMd(quoted))}</p></blockquote>`);
      continue;
    }

    if (/^---+$/.test(block)) {
      htmlParts.push("<hr />");
      continue;
    }

    // Soft line breaks inside a paragraph (field-heavy agent output).
    const withBreaks = block
      .split("\n")
      .map((line) => decorateInline(inlineMd(line.trim())))
      .filter(Boolean)
      .join("<br />\n");
    htmlParts.push(`<p>${withBreaks}</p>`);
  }

  return htmlParts.join("\n");
}

function renderListBlock(block: string): string {
  const lines = block.split("\n");
  const ordered = /^\d+\. /.test(lines[0]!);
  const tag = ordered ? "ol" : "ul";
  const className = ordered ? ' class="md-findings"' : ' class="md-bullets"';
  const items: string[] = [];
  let current: string | null = null;

  const flush = () => {
    if (current == null) return;
    const body = decorateInline(inlineMd(current));
    // Finding-style items: title + structured fields
    if (ordered && /md-sev|md-field-label/.test(body)) {
      items.push(`<li class="md-finding">${body}</li>`);
    } else {
      items.push(`<li>${body}</li>`);
    }
    current = null;
  };

  for (const line of lines) {
    const start = /^(- |\* |\d+\. )(.*)$/.exec(line);
    if (start) {
      flush();
      current = start[2]!.trim();
      continue;
    }
    if (current != null && line.trim()) {
      current += `\n${line.trim()}`;
    }
  }
  flush();

  return `<${tag}${className}>${items.join("")}</${tag}>`;
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

/** Turn Severity/Where/Issue labels into scannable fields + severity chips. */
function decorateInline(html: string): string {
  let out = html;

  out = out.replace(
    /<strong>Severity:<\/strong>\s*(high|medium|low)/gi,
    (_m, sev: string) => {
      const s = sev.toLowerCase();
      return `<span class="md-field"><span class="md-field-label">Severity</span><span class="md-sev md-sev-${s}">${s}</span></span>`;
    },
  );

  out = out.replace(
    /<strong>(Where|Issue|Why it matters|Suggestion):<\/strong>/gi,
    (_m, label: string) =>
      `<span class="md-field"><span class="md-field-label">${escapeHtml(label)}</span></span>`,
  );

  // Break before each field so walls of text become rows.
  out = out.replace(/(?<!^)(?<!<br \/>\n)(<span class="md-field">)/g, "<br />\n$1");

  // Soft-break after a bold title at the start of a finding ("**Title.** Severity…")
  out = out.replace(
    /^(<strong>[^<]+<\/strong>)(\s*)(<br \/>|<span class="md-field">)/,
    "$1<br />\n$3",
  );

  return out;
}
