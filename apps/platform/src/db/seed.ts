import { eq } from "drizzle-orm";
import type { Db } from "./client.js";
import { enrolledRepos, organizations } from "./schema.js";

export const FIXTURE_ORG_NAME = "fixture-org";
export const FIXTURE_REPO_FULL_NAME = "fixture/sample-repo";

export async function seedFixture(db: Db): Promise<{ orgId: string; repoId: string }> {
  const existing = await db
    .select()
    .from(organizations)
    .where(eq(organizations.name, FIXTURE_ORG_NAME))
    .limit(1);

  let orgId = existing[0]?.id;
  if (!orgId) {
    const [org] = await db
      .insert(organizations)
      .values({ name: FIXTURE_ORG_NAME })
      .returning();
    orgId = org!.id;
  }

  const existingRepo = await db
    .select()
    .from(enrolledRepos)
    .where(eq(enrolledRepos.fullName, FIXTURE_REPO_FULL_NAME))
    .limit(1);

  let repoId = existingRepo[0]?.id;
  if (!repoId) {
    const [repo] = await db
      .insert(enrolledRepos)
      .values({
        orgId,
        fullName: FIXTURE_REPO_FULL_NAME,
        defaultBranch: "main",
        enabled: 1,
        githubRepoId: "fixture",
      })
      .returning();
    repoId = repo!.id;
  }

  return { orgId, repoId };
}
