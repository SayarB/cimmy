import { eq } from "drizzle-orm";
import type { Db } from "./db/client.js";
import { organizations } from "./db/schema.js";

export async function ensureDefaultOrg(db: Db, name: string): Promise<string> {
  const existing = await db.select().from(organizations).where(eq(organizations.name, name)).limit(1);
  if (existing[0]) return existing[0].id;
  const [org] = await db.insert(organizations).values({ name }).returning();
  return org!.id;
}
