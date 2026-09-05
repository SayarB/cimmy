import { escapeHtml } from "./layout.js";

type StreamEvent = Record<string, unknown>;

export type TranscriptEntry =
  | { kind: "meta"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "thinking"; text: string }
  | { kind: "tool"; name: string; detail: string; status: "started" | "ok" | "rejected" | "error" }
  | { kind: "result"; text: string; ok: boolean };

/**
 * Parse Cursor agent stream-json / NDJSON into readable timeline entries.
 */
export function parseTranscript(raw: string): TranscriptEntry[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim());
  const entries: TranscriptEntry[] = [];
  let thinkingBuf = "";
  let assistantBuf = "";

  const flushThinking = () => {
    const t = thinkingBuf.trim();
    if (t) entries.push({ kind: "thinking", text: t });
    thinkingBuf = "";
  };
  const flushAssistant = () => {
    const t = assistantBuf.trim();
    if (t) entries.push({ kind: "assistant", text: t });
    assistantBuf = "";
  };

  for (const line of lines) {
    let ev: StreamEvent;
    try {
      ev = JSON.parse(line) as StreamEvent;
    } catch {
      flushThinking();
      flushAssistant();
      entries.push({ kind: "meta", text: line.slice(0, 500) });
      continue;
    }

    const type = String(ev.type ?? "");
    const subtype = String(ev.subtype ?? "");

    if (type === "system" && subtype === "init") {
      flushThinking();
      flushAssistant();
      const model = ev.model ? String(ev.model) : "unknown";
      const cwd = ev.cwd ? String(ev.cwd) : "";
      entries.push({
        kind: "meta",
        text: `session · model ${model}${cwd ? ` · ${cwd}` : ""}`,
      });
      continue;
    }

    if (type === "user") {
      // Prompt is already known from the skill; skip the huge dump.
      continue;
    }

    if (type === "thinking") {
      flushAssistant();
      if (subtype === "delta" && typeof ev.text === "string") {
        thinkingBuf += ev.text;
      } else if (subtype === "completed") {
        flushThinking();
      }
      continue;
    }

    if (type === "assistant") {
      flushThinking();
      const msg = ev.message as { content?: Array<{ type?: string; text?: string }> } | undefined;
      const parts = msg?.content ?? [];
      for (const p of parts) {
        if (p?.type === "text" && p.text) assistantBuf += p.text;
      }
      continue;
    }

    if (type === "tool_call") {
      flushThinking();
      flushAssistant();
      const toolCall = (ev.tool_call ?? {}) as Record<string, unknown>;
      const { name, detail } = describeTool(toolCall);
      if (subtype === "started") {
        entries.push({ kind: "tool", name, detail, status: "started" });
      } else if (subtype === "completed") {
        const status = toolStatus(toolCall);
        // Replace last matching started, or append.
        const last = entries[entries.length - 1];
        if (last?.kind === "tool" && last.name === name && last.status === "started") {
          last.status = status;
          if (detail) last.detail = detail;
        } else {
          entries.push({ kind: "tool", name, detail, status });
        }
      }
      continue;
    }

    if (type === "result") {
      flushThinking();
      flushAssistant();
      const ok = subtype === "success" || ev.is_error === false;
      const text =
        typeof ev.result === "string"
          ? ev.result
          : ok
            ? "completed"
            : String(ev.error ?? subtype ?? "failed");
      entries.push({ kind: "result", text: text.slice(0, 2000), ok });
      continue;
    }
  }

  flushThinking();
  flushAssistant();
  return entries;
}

export function renderTranscriptHtml(raw: string): string {
  const entries = parseTranscript(raw);
  if (entries.length === 0) {
    return `<p class="muted">Empty transcript.</p>`;
  }

  const parts: string[] = ['<ol class="tx-log">'];
  for (const e of entries) {
    if (e.kind === "meta") {
      parts.push(`<li class="tx-meta"><span class="tx-label">meta</span><span class="tx-body">${escapeHtml(e.text)}</span></li>`);
    } else if (e.kind === "thinking") {
      parts.push(
        `<li class="tx-thinking"><span class="tx-label">thinking</span><pre class="tx-body">${escapeHtml(e.text)}</pre></li>`,
      );
    } else if (e.kind === "assistant") {
      parts.push(
        `<li class="tx-assistant"><span class="tx-label">assistant</span><div class="tx-body">${escapeHtml(e.text)}</div></li>`,
      );
    } else if (e.kind === "tool") {
      const st = e.status === "ok" ? "ok" : e.status === "rejected" ? "rejected" : e.status === "error" ? "error" : "started";
      parts.push(
        `<li class="tx-tool tx-${st}"><span class="tx-label">tool · ${escapeHtml(e.name)}</span><span class="tx-status">${escapeHtml(st)}</span>${e.detail ? `<div class="tx-body">${escapeHtml(e.detail)}</div>` : ""}</li>`,
      );
    } else if (e.kind === "result") {
      parts.push(
        `<li class="tx-result ${e.ok ? "tx-ok" : "tx-error"}"><span class="tx-label">result</span><div class="tx-body">${escapeHtml(e.text)}</div></li>`,
      );
    }
  }
  parts.push("</ol>");
  return parts.join("\n");
}

function describeTool(toolCall: Record<string, unknown>): { name: string; detail: string } {
  if (toolCall.grepToolCall) {
    const g = toolCall.grepToolCall as { args?: { pattern?: string; path?: string } };
    return {
      name: "grep",
      detail: [g.args?.pattern, g.args?.path].filter(Boolean).join(" · "),
    };
  }
  if (toolCall.shellToolCall) {
    const s = toolCall.shellToolCall as {
      args?: { command?: string; description?: string };
      result?: { rejected?: { command?: string }; success?: unknown };
      description?: string;
    };
    const cmd = s.args?.command ?? s.result?.rejected?.command ?? "";
    return {
      name: "shell",
      detail: s.args?.description || s.description || truncate(cmd, 160),
    };
  }
  if (toolCall.editToolCall || toolCall.writeToolCall) {
    const e = (toolCall.editToolCall ?? toolCall.writeToolCall) as {
      args?: { path?: string };
      result?: { success?: { path?: string; message?: string } };
    };
    return {
      name: "write",
      detail: e.result?.success?.path || e.args?.path || "",
    };
  }
  if (toolCall.readToolCall) {
    const r = toolCall.readToolCall as { args?: { path?: string } };
    return { name: "read", detail: r.args?.path ?? "" };
  }
  const keys = Object.keys(toolCall).filter((k) => k.endsWith("ToolCall"));
  const key = keys[0] ?? "tool";
  return { name: key.replace(/ToolCall$/, ""), detail: "" };
}

function toolStatus(toolCall: Record<string, unknown>): "ok" | "rejected" | "error" {
  for (const v of Object.values(toolCall)) {
    if (!v || typeof v !== "object") continue;
    const result = (v as { result?: Record<string, unknown> }).result;
    if (!result) continue;
    if (result.rejected) return "rejected";
    if (result.error || result.failure) return "error";
    if (result.success) return "ok";
  }
  return "ok";
}

function truncate(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}
