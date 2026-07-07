/**
 * MoneyDNA — Event telemetry (extended for the Daily Decision Engine)
 * ------------------------------------------------------------------
 * The instrumentation that turns the app into EVIDENCE. Supersedes the Companion
 * layer's events.ts (adds decision-engine events + the 3 pilot numbers).
 */

import { prisma } from "@/lib/prisma";

export type EventName =
  | "app_opened"
  | "today_viewed"
  | "discovery_started"
  | "discovery_step"
  | "discovery_completed"
  | "dna_revealed"
  | "dna_shared"
  | "situation_saved"
  | "decision_generated"
  | "decision_followed"
  | "decision_skipped"
  | "weekly_viewed"
  | "statement_uploaded"
  | "coach_question_asked"
  | "blueprint_generated"
  | "goal_created"
  | "confidence_checked";

export async function logEvent(userId: string, name: EventName, props?: Record<string, unknown>): Promise<void> {
  try {
    await prisma.event.create({ data: { userId, name, props: props ? JSON.stringify(props) : null } });
  } catch (err) {
    console.error("[events] failed to log", name, err);
  }
}

/**
 * The pilot snapshot — the ONLY numbers that matter early. Built to be
 * screenshotted for an investor: the three signals that prove Hypothesis 001.
 */
export async function pilotMetrics() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, activeUsers, todayViews, generated, followed, skipped, discoveryDone] = await Promise.all([
    prisma.user.count(),
    prisma.event.findMany({ where: { name: "today_viewed", createdAt: { gte: since } }, select: { userId: true } }),
    prisma.event.count({ where: { name: "today_viewed", createdAt: { gte: since } } }),
    prisma.event.count({ where: { name: "decision_generated", createdAt: { gte: since } } }),
    prisma.event.count({ where: { name: "decision_followed", createdAt: { gte: since } } }),
    prisma.event.count({ where: { name: "decision_skipped", createdAt: { gte: since } } }),
    prisma.event.count({ where: { name: "discovery_completed" } }),
  ]);

  const weeklyActive = new Set(activeUsers.map((e: { userId: string }) => e.userId)).size;
  const decided = followed + skipped;

  // (1) Morning Brief open rate — proxy: today_views per active user over 7 days (7 = daily).
  const openRatePct = weeklyActive ? Math.min(100, Math.round((todayViews / (weeklyActive * 7)) * 100)) : 0;
  // (2) Decision follow-through — of decisions acted on, how many were followed.
  const followThroughPct = decided ? Math.round((followed / decided) * 100) : 0;

  return {
    totalUsers,
    discoveryCompleted: discoveryDone,
    weeklyActiveUsers: weeklyActive,
    decisionsGenerated: generated,
    decisionsFollowed: followed,
    decisionsSkipped: skipped,
    openRatePct, // number 1 to watch
    followThroughPct, // number 2 to watch
  };
}
