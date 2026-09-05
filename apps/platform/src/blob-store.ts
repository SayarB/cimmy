import fs from "node:fs/promises";
import path from "node:path";

export type StoredArtifact = {
  kind: string;
  storagePath: string;
  size: number;
  contentType: string;
};

export class BlobStore {
  constructor(private readonly rootDir: string) {}

  runDir(runId: string): string {
    return path.join(this.rootDir, runId);
  }

  async ensureRunDir(runId: string): Promise<string> {
    const dir = this.runDir(runId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  async writeFile(
    runId: string,
    kind: string,
    relativeName: string,
    data: Buffer | string,
    contentType: string,
  ): Promise<StoredArtifact> {
    const dir = await this.ensureRunDir(runId);
    const storagePath = path.join(dir, relativeName);
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    const buf = typeof data === "string" ? Buffer.from(data) : data;
    await fs.writeFile(storagePath, buf);
    return {
      kind,
      storagePath,
      size: buf.length,
      contentType,
    };
  }
}
