/** Map platform run status → Herdr-style display label (docs/Design.md). */
export function statusLabel(status: string): { label: string; kind: "idle" | "working" | "done" | "failed" | "blocked" } {
  switch (status) {
    case "queued":
    case "pending":
      return { label: "idle", kind: "idle" };
    case "running":
    case "starting":
      return { label: "working", kind: "working" };
    case "succeeded":
    case "succeeded_with_findings":
      return { label: "done", kind: "done" };
    case "failed":
    case "timed_out":
    case "cancelled":
      return { label: "failed", kind: "failed" };
    default:
      return { label: status || "idle", kind: "idle" };
  }
}

export function statusGlyph(kind: ReturnType<typeof statusLabel>["kind"]): string {
  switch (kind) {
    case "working":
      return "●";
    case "blocked":
      return "◉";
    case "done":
      return "●";
    case "failed":
      return "●";
    default:
      return "○";
  }
}
