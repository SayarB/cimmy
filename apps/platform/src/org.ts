import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import type { Db } from "./db/client.js";
import { orgMembers, organizations } from "./db/schema.js";

/**
 * Find-or-create this user's org. Idempotent, so it is safe to call on every
 * signup path (OAuth and magic link both land here via the Better Auth hook).
 */
export async function ensureUserOrg(
  db: Db,
  userId: string,
  displayName: string,
): Promise<string> {
  const member = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .limit(1);
  if (member[0]) return member[0].orgId;

  const [org] = await db
    .insert(organizations)
    .values({ name: displayName })
    .returning();
  await db.insert(orgMembers).values({ orgId: org!.id, userId, role: "owner" });
  return org!.id;
}

/**
 * The caller's org. Throws rather than creating, so a missing membership
 * surfaces as an error instead of silently minting an org on a read path.
 */
export async function requireOrg(db: Db, userId: string | undefined): Promise<string> {
  if (!userId) {
    throw new HTTPException(401, { message: "unauthorized" });
  }
  const member = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .limit(1);
  if (!member[0]) {
    throw new HTTPException(403, { message: "no organization for user" });
  }
  return member[0].orgId;
}
