export function scaffoldSkill(opts: {
  jobId: string;
  name: string;
  body: string;
  description?: string;
  schedule?: string;
  notify?: "always" | "findings" | "failure" | "never";
  timeoutMinutes?: number;
}): string {
  const lines = [
    "---",
    `name: ${opts.name}`,
  ];
  if (opts.description) lines.push(`description: ${opts.description}`);
  lines.push("enabled: true");
  lines.push("mode: report");
  if (opts.schedule) lines.push(`schedule: "${opts.schedule}"`);
  lines.push("timezone: UTC");
  lines.push(`timeout_minutes: ${opts.timeoutMinutes ?? 30}`);
  lines.push(`notify: ${opts.notify ?? "findings"}`);
  lines.push("outputs:");
  lines.push("  report: report.md");
  lines.push("---");
  lines.push("");
  lines.push(opts.body.trim());
  lines.push("");
  return lines.join("\n");
}
