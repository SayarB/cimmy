import { eq } from "drizzle-orm";
import type { Config } from "./config.js";
import type { Db } from "./db/client.js";
import { enrolledRepos, runArtifacts, runs } from "./db/schema.js";
import { BlobStore } from "./blob-store.js";
import { buildRunContainerEnv } from "./docker/env.js";
import type { DockerRunner } from "./docker/runner.js";
import { cloneHttpsUrl, createInstallationToken } from "./github/app.js";
import { resolveTerminalStatus } from "./run-status-resolve.js";

export type WorkerDeps = {
  db: Db;
  runner: DockerRunner;
  config: Config;
};

function contentTypeFor(name: string): string {
  if (name.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (name.endsWith(".json")) return "application/json";
  return "application/octet-stream";
}

function artifactKind(name: string): string | null {
  const base = name.split("/").pop() ?? name;
  if (base === ".env" || name.includes(".env")) return null;
  if (base === "report.md" || name.endsWith("/report.md")) return "report";
  if (base.includes("transcript")) return "transcript";
  if (base === "meta.json") return "meta";
  if (name.startsWith("events/") || name.includes("/events/")) return "events";
  if (base === "error.json") return "error";
  return "other_out";
}

export async function processNextRun(deps: WorkerDeps): Promise<boolean> {
  const queued = await deps.db
    .select()
    .from(runs)
    .where(eq(runs.status, "queued"))
    .limit(1);

  const run = queued[0];
  if (!run) return false;

  const blobs = new BlobStore(deps.config.artifactsDir);
  const timeoutMs = run.timeoutMinutes * 60_000;

  await deps.db
    .update(runs)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(runs.id, run.id));

  let containerId: string | undefined;
  try {
    const isFixture = run.trigger === "fixture";
    let cloneUrl: string | undefined;
    let githubToken: string | undefined;
    let cloneRef: string | undefined;

    if (!isFixture) {
      const repoRows = await deps.db
        .select()
        .from(enrolledRepos)
        .where(eq(enrolledRepos.id, run.repoId))
        .limit(1);
      const repo = repoRows[0];
      if (!repo?.installationId || !repo.fullName) {
        throw new Error("Enrolled repo missing installation or full_name");
      }
      if (repo.enabled !== 1) {
        throw new Error("Enrolled repo is disabled");
      }
      const token = await createInstallationToken(deps.config, repo.installationId);
      cloneUrl = cloneHttpsUrl(repo.fullName);
      githubToken = token.token;
      cloneRef = repo.defaultBranch;
    }

    const env = buildRunContainerEnv({
      runId: run.id,
      fixture: isFixture,
      agentStub: deps.config.agentStub,
      timeoutMinutes: run.timeoutMinutes,
      cursorApiKey: process.env.CURSOR_API_KEY,
      cloneUrl,
      githubToken,
      cloneRef,
    });

    const spawned = await deps.runner.spawn({
      runId: run.id,
      image: deps.config.runtimeImage,
      env,
      network: deps.config.dockerNetwork,
      timeoutMs,
    });
    containerId = spawned.containerId;

    await deps.db
      .update(runs)
      .set({ containerId })
      .where(eq(runs.id, run.id));

    const harvest = await deps.runner.waitAndHarvest(run.id, containerId, timeoutMs);

    const skillIds: string[] = [];
    const artifactRows: Array<{
      runId: string;
      kind: string;
      storagePath: string;
      size: number;
      contentType: string;
    }> = [];

    let unsupportedModeError: string | undefined;

    for (const file of harvest.files) {
      const kind = artifactKind(file.name);
      if (!kind) continue;

      if (file.name.endsWith("meta.json")) {
        try {
          const meta = JSON.parse(file.data.toString("utf8")) as { skillIds?: string[] };
          if (Array.isArray(meta.skillIds)) {
            skillIds.push(...meta.skillIds);
          }
        } catch {
          // ignore
        }
      }
      if (file.name.endsWith("error.json")) {
        try {
          const err = JSON.parse(file.data.toString("utf8")) as {
            error?: string;
            mode?: string;
            skill?: string;
          };
          if (err.error === "unsupported_mode") {
            unsupportedModeError = `Unsupported skill mode: ${err.mode ?? "unknown"} (skill ${err.skill ?? "?"})`;
          }
        } catch {
          // ignore
        }
      }

      const stored = await blobs.writeFile(
        run.id,
        kind,
        file.name,
        file.data,
        contentTypeFor(file.name),
      );
      artifactRows.push({
        runId: run.id,
        kind: stored.kind,
        storagePath: stored.storagePath,
        size: stored.size,
        contentType: stored.contentType,
      });
    }

    if (artifactRows.length > 0) {
      await deps.db.insert(runArtifacts).values(artifactRows);
    }

    const hasReport = artifactRows.some((a) => a.kind === "report" && a.size > 0);
    let terminal = resolveTerminalStatus({
      timedOut: harvest.timedOut,
      exitCode: harvest.exitCode,
      hasReport,
    });

    if (unsupportedModeError && !hasReport) {
      terminal = { status: "failed", errorSummary: unsupportedModeError };
    }

    await deps.db
      .update(runs)
      .set({
        status: terminal.status,
        finishedAt: new Date(),
        imageDigest: harvest.imageDigest ?? null,
        errorSummary: terminal.errorSummary ?? null,
        skillIds: skillIds.length > 0 ? skillIds : run.skillIds,
      })
      .where(eq(runs.id, run.id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await deps.db
      .update(runs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorSummary: message.slice(0, 2000),
      })
      .where(eq(runs.id, run.id));
  } finally {
    if (containerId) {
      try {
        await deps.runner.destroy(containerId);
      } catch (err) {
        console.error("failed to destroy container", containerId, err);
      }
    }
  }

  return true;
}

export function startWorker(deps: WorkerDeps): void {
  const tick = async () => {
    try {
      let worked = true;
      while (worked) {
        worked = await processNextRun(deps);
      }
    } catch (err) {
      console.error("worker tick failed", err);
    }
  };

  void tick();
  setInterval(() => void tick(), 2000);
}
