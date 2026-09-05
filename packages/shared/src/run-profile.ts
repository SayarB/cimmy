export type SkillMode = "report" | "workspace" | "pr";

export type RunProfile = {
  mode: SkillMode;
  githubScopes: "read" | "write-pr";
  allowForceCli: boolean;
  network: "allowlist";
  harvest: Array<"out" | "transcript">;
};

export class UnsupportedModeError extends Error {
  readonly mode: SkillMode;

  constructor(mode: SkillMode) {
    super(`Unsupported skill mode: ${mode}`);
    this.name = "UnsupportedModeError";
    this.mode = mode;
  }
}

export function resolveRunProfile(mode: SkillMode | undefined): RunProfile {
  const m = mode ?? "report";
  if (m !== "report") {
    throw new UnsupportedModeError(m);
  }
  return {
    mode: "report",
    githubScopes: "read",
    allowForceCli: false,
    network: "allowlist",
    harvest: ["out", "transcript"],
  };
}
