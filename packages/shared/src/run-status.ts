export const RUN_STATUSES = [
  "queued",
  "running",
  "succeeded",
  "succeeded_with_findings",
  "failed",
  "timed_out",
  "cancelled",
] as const;

export type RunStatus = (typeof RUN_STATUSES)[number];

export type RunTrigger = "manual" | "cron" | "fixture";
