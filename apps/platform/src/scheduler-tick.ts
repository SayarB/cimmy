import { CronExpressionParser } from "cron-parser";
import { and, eq } from "drizzle-orm";
import { parseSkillMd, resolveRunProfile, UnsupportedModeError } from "@cimmy/shared";
import type { Config } from "./config.js";
import type { Db } from "./db/client.js";
import { enrolledRepos, runs, scheduleCursors } from "./db/schema.js";
import { listCimmySkillsViaApi } from "./github/app.js";
import { effectiveCron } from "./scheduler.js";

export type SchedulerDeps = {
  db: Db;
  config: Config;
};

export async function tickSchedules(deps: SchedulerDeps, now = new Date()): Promise<number> {
  let enqueued = 0;
  const repos = await deps.db
    .select()
    .from(enrolledRepos)
    .where(eq(enrolledRepos.enabled, 1));

  for (const repo of repos) {
    if (!repo.installationId) continue;
    let skills: Array<{ jobId: string; raw: string }>;
    try {
      skills = await listCimmySkillsViaApi(
        deps.config,
        repo.installationId,
        repo.fullName,
        repo.defaultBranch,
      );
    } catch (err) {
      console.error("scheduler skill fetch failed", repo.fullName, err);
      continue;
    }

    for (const skill of skills) {
      let parsed;
      try {
        parsed = parseSkillMd(skill.jobId, skill.raw);
        resolveRunProfile(parsed.frontmatter.mode);
      } catch (err) {
        if (err instanceof UnsupportedModeError) continue;
        continue;
      }
      if (parsed.frontmatter.enabled === false) continue;

      const cronExpr = effectiveCron(parsed.frontmatter);
      const tz = parsed.frontmatter.timezone ?? "UTC";
      const cursorRows = await deps.db
        .select()
        .from(scheduleCursors)
        .where(
          and(eq(scheduleCursors.repoId, repo.id), eq(scheduleCursors.skillId, skill.jobId)),
        )
        .limit(1);

      // First sighting: arm schedule without immediate enqueue.
      if (!cursorRows[0]) {
        await deps.db.insert(scheduleCursors).values({
          repoId: repo.id,
          skillId: skill.jobId,
          cronExpr,
          lastEnqueuedAt: now,
        });
        continue;
      }

      const last = cursorRows[0].lastEnqueuedAt ?? now;
      if (now.getTime() - last.getTime() < 55_000) continue;

      let due = false;
      try {
        const interval = CronExpressionParser.parse(cronExpr, {
          currentDate: last,
          tz,
        });
        const next = interval.next().toDate();
        due = next.getTime() <= now.getTime();
      } catch {
        continue;
      }
      if (!due) continue;

      await deps.db.insert(runs).values({
        orgId: repo.orgId,
        repoId: repo.id,
        skillIds: [skill.jobId],
        mode: "report",
        status: "queued",
        trigger: "cron",
        scheduledAt: now,
        timeoutMinutes: Math.min(
          parsed.frontmatter.timeout_minutes ?? deps.config.defaultTimeoutMinutes,
          deps.config.platformMaxTimeoutMinutes,
        ),
      });
      enqueued += 1;

      await deps.db
        .update(scheduleCursors)
        .set({ lastEnqueuedAt: now, cronExpr })
        .where(eq(scheduleCursors.id, cursorRows[0].id));
    }
  }

  return enqueued;
}

export function startScheduler(deps: SchedulerDeps): void {
  const run = async () => {
    try {
      const n = await tickSchedules(deps);
      if (n > 0) console.log(`scheduler enqueued ${n} run(s)`);
    } catch (err) {
      console.error("scheduler tick failed", err);
    }
  };
  void run();
  setInterval(() => void run(), 60_000);
}
