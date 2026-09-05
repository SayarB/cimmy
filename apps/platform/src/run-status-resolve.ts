import type { RunStatus } from "@cimmy/shared";

export function resolveTerminalStatus(input: {
  timedOut: boolean;
  exitCode: number | null;
  hasReport: boolean;
}): { status: RunStatus; errorSummary?: string } {
  if (input.timedOut) {
    return { status: "timed_out", errorSummary: "Run exceeded wall-clock timeout" };
  }
  if (input.exitCode !== 0 && input.exitCode !== null) {
    return {
      status: "failed",
      errorSummary: `Runtime exited with code ${input.exitCode}`,
    };
  }
  if (!input.hasReport) {
    return { status: "failed", errorSummary: "No report artifact harvested" };
  }
  return { status: "succeeded" };
}
