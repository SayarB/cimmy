import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HTTPException } from "hono/http-exception";
import { ensureUserOrg, requireOrg } from "./org.js";
import type { Db } from "./db/client.js";
import { orgMembers, organizations } from "./db/schema.js";

type Row = { orgId: string; userId: string; role: string };

/**
 * Drizzle's `where` takes an SQL condition, not a predicate, so the fake pulls
 * the bound value out of the condition's Param chunk. org.ts only ever filters
 * org_members by a single column, so matching any field against that value is
 * enough — and keeps the test honest about which row would come back.
 */
function boundValue(condition: unknown): string | undefined {
  const chunks = (condition as { queryChunks?: unknown[] })?.queryChunks ?? [];
  for (const chunk of chunks) {
    if (chunk && typeof chunk === "object" && chunk.constructor?.name === "Param") {
      return (chunk as { value: string }).value;
    }
  }
  return undefined;
}

/** Minimal in-memory stand-in for the two tables org.ts touches. */
function fakeDb(): { db: Db; members: Row[]; orgs: Array<{ id: string; name: string }> } {
  const members: Row[] = [];
  const orgs: Array<{ id: string; name: string }> = [];
  let seq = 0;

  const db = {
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          const wanted = boundValue(condition);
          const matched = members.filter((m) => Object.values(m).includes(wanted!));
          return { limit: () => matched.slice(0, 1) };
        },
      }),
    }),
    insert: (table: unknown) => ({
      values: (v: Record<string, string>) => {
        if (table === organizations) {
          const org = { id: `org-${++seq}`, name: v.name! };
          orgs.push(org);
          return { returning: () => [org] };
        }
        if (table !== orgMembers) throw new Error("unexpected table in fake db");
        members.push({ orgId: v.orgId!, userId: v.userId!, role: v.role ?? "owner" });
        return { returning: () => [v] };
      },
    }),
  } as unknown as Db;

  return { db, members, orgs };
}

describe("ensureUserOrg", () => {
  it("creates one org and one membership for a new user", async () => {
    const { db, members, orgs } = fakeDb();
    const orgId = await ensureUserOrg(db, "u1", "Ada");
    assert.equal(orgs.length, 1);
    assert.equal(members.length, 1);
    assert.equal(members[0]!.userId, "u1");
    assert.equal(members[0]!.role, "owner");
    assert.equal(orgId, orgs[0]!.id);
  });

  it("is idempotent — a second call returns the same org and adds no rows", async () => {
    const { db, members, orgs } = fakeDb();
    const first = await ensureUserOrg(db, "u1", "Ada");
    const second = await ensureUserOrg(db, "u1", "Ada");
    assert.equal(first, second);
    assert.equal(orgs.length, 1);
    assert.equal(members.length, 1);
  });

  it("gives two users different orgs", async () => {
    const { db } = fakeDb();
    const a = await ensureUserOrg(db, "u1", "Ada");
    const b = await ensureUserOrg(db, "u2", "Grace");
    assert.notEqual(a, b);
  });
});

describe("requireOrg", () => {
  it("returns the caller's org", async () => {
    const { db } = fakeDb();
    const orgId = await ensureUserOrg(db, "u1", "Ada");
    assert.equal(await requireOrg(db, "u1"), orgId);
  });

  it("throws 401 when unauthenticated", async () => {
    const { db } = fakeDb();
    await assert.rejects(
      () => requireOrg(db, undefined),
      (err: unknown) => err instanceof HTTPException && err.status === 401,
    );
  });

  it("throws 403 when the user has no org, and never creates one", async () => {
    const { db, orgs } = fakeDb();
    await assert.rejects(
      () => requireOrg(db, "ghost"),
      (err: unknown) => err instanceof HTTPException && err.status === 403,
    );
    assert.equal(orgs.length, 0);
  });
});
