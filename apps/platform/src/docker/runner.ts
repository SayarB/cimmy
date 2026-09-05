import Docker from "dockerode";
import path from "node:path";
import { finished } from "node:stream/promises";
import * as tar from "tar-stream";
import { assertNoPostgresCreds } from "./env.js";

export type SpawnSpec = {
  runId: string;
  image: string;
  env: Record<string, string>;
  network: string;
  timeoutMs: number;
};

export type HarvestResult = {
  exitCode: number | null;
  timedOut: boolean;
  files: Array<{ name: string; data: Buffer }>;
  imageDigest?: string;
};

export interface DockerRunner {
  spawn(spec: SpawnSpec): Promise<{ containerId: string }>;
  waitAndHarvest(runId: string, containerId: string, timeoutMs: number): Promise<HarvestResult>;
  destroy(containerId: string): Promise<void>;
}

export class DockerodeRunner implements DockerRunner {
  private readonly docker: Docker;

  constructor(docker?: Docker) {
    this.docker = docker ?? new Docker({ socketPath: process.env.DOCKER_HOST?.replace("unix://", "") || "/var/run/docker.sock" });
  }

  async spawn(spec: SpawnSpec): Promise<{ containerId: string }> {
    assertNoPostgresCreds(spec.env);

    const Env = Object.entries(spec.env).map(([k, v]) => `${k}=${v}`);
    const container = await this.docker.createContainer({
      Image: spec.image,
      Env,
      Labels: {
        "cimmy.run_id": spec.runId,
        "cimmy.role": "cursor-runtime",
      },
      HostConfig: {
        AutoRemove: false,
        CapDrop: ["ALL"],
        NetworkMode: spec.network,
        Tmpfs: {
          "/tmp": "rw,noexec,nosuid,size=64m",
        },
        // Writable work/out via anonymous volumes
        Binds: [],
      },
      Volumes: {
        "/work": {},
        "/out": {},
      },
    });

    await container.start();
    return { containerId: container.id };
  }

  async waitAndHarvest(
    runId: string,
    containerId: string,
    timeoutMs: number,
  ): Promise<HarvestResult> {
    const container = this.docker.getContainer(containerId);
    let timedOut = false;
    let exitCode: number | null = null;

    const waitPromise = container.wait().then((result) => {
      exitCode = typeof result?.StatusCode === "number" ? result.StatusCode : null;
    });

    const timeoutPromise = new Promise<"timeout">((resolve) => {
      setTimeout(() => resolve("timeout"), timeoutMs);
    });

    const winner = await Promise.race([waitPromise.then(() => "done" as const), timeoutPromise]);
    if (winner === "timeout") {
      timedOut = true;
      try {
        await container.kill();
      } catch {
        // may already have exited
      }
      try {
        await waitPromise;
      } catch {
        // ignore
      }
    }

    const files = await this.copyOut(containerId);
    let imageDigest: string | undefined;
    try {
      const inspect = await container.inspect();
      imageDigest = inspect.Image;
    } catch {
      // destroyed mid-flight
    }

    return { exitCode, timedOut, files, imageDigest };
  }

  async destroy(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    try {
      await container.remove({ force: true, v: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!/No such container/i.test(msg)) {
        throw err;
      }
    }
  }

  private async copyOut(containerId: string): Promise<Array<{ name: string; data: Buffer }>> {
    const container = this.docker.getContainer(containerId);
    const files: Array<{ name: string; data: Buffer }> = [];

    let stream: NodeJS.ReadableStream;
    try {
      stream = await container.getArchive({ path: "/out" });
    } catch {
      return files;
    }

    const extract = tar.extract();
    extract.on("entry", (header, entryStream, next) => {
      const chunks: Buffer[] = [];
      entryStream.on("data", (c: unknown) => {
        chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c as Uint8Array));
      });
      entryStream.on("end", () => {
        if (header.type === "file") {
          // tar path like "out/report.md" or "./report.md"
          const name = header.name.replace(/^(\.\/)?out\//, "").replace(/^\.\//, "");
          if (name && !name.endsWith("/") && path.basename(name) !== ".env") {
            files.push({ name, data: Buffer.concat(chunks) });
          }
        }
        next();
      });
      entryStream.resume();
    });

    stream.pipe(extract);
    await finished(extract);
    return files;
  }
}

/** Test helper: list containers by run label (for smoke). */
export async function listContainersByRunId(
  runId: string,
  docker = new Docker({ socketPath: "/var/run/docker.sock" }),
): Promise<Docker.ContainerInfo[]> {
  return docker.listContainers({
    all: true,
    filters: { label: [`cimmy.run_id=${runId}`] },
  });
}
