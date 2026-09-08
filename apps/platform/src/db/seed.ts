import { eq } from "drizzle-orm";
import type { Db } from "./client.js";
import { enrolledRepos, orgMembers, organizations, user } from "./schema.js";

export const FIXTURE_ORG_NAME = "fixture-org";
export const FIXTURE_USER_ID = "fixture-user";
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

  // Fixture runs have no session, but the org still needs an owner so the
  // membership invariant holds everywhere.
  const existingUser = await db.select().from(user).where(eq(user.id, FIXTURE_USER_ID)).limit(1);
  if (!existingUser[0]) {
    await db.insert(user).values({
      id: FIXTURE_USER_ID,
      name: "Fixture",
      email: "fixture@cimmy.local",
      emailVerified: true,
    });
  }
  const existingMember = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.userId, FIXTURE_USER_ID))
    .limit(1);
  if (!existingMember[0]) {
    await db.insert(orgMembers).values({ orgId, userId: FIXTURE_USER_ID, role: "owner" });
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
