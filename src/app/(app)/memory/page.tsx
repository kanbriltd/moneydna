import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MemoryView from "@/components/memory/MemoryView";

export default async function MemoryPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [profile, situation, decisions] = await Promise.all([
    prisma.companionProfile.findUnique({ where: { userId } }),
    prisma.moneySituation.findUnique({ where: { userId } }),
    prisma.dailyDecision.findMany({
      where: { userId },
      orderBy: { forDate: "desc" },
      take: 60,
      select: { id: true, forDate: true, title: true, status: true, band: true, estimatedImpact: true },
    }),
  ]);

  return (
    <MemoryView
      profile={
        profile
          ? {
              discoveryComplete: profile.discoveryComplete,
              dnaLabel: profile.dnaLabel,
              dnaSummary: profile.dnaSummary,
              moneyStory: profile.moneyStory,
              temperament: profile.temperament,
              planning: profile.planning,
              riskComfort: profile.riskComfort,
              lifeStage: profile.lifeStage,
              supportsFamily: profile.supportsFamily,
              goodLife: profile.goodLife,
              biggestFear: profile.biggestFear,
              futureVision: profile.futureVision,
              traits: {
                saver: profile.traitSaver,
                planner: profile.traitPlanner,
                impulse: profile.traitImpulse,
                risk: profile.traitRisk,
                discipline: profile.traitDiscipline,
              },
            }
          : null
      }
      situation={
        situation
          ? {
              monthlyIncome: situation.monthlyIncome,
              monthlySavings: situation.monthlySavings,
              paydayDay: situation.paydayDay,
              topExpense1: situation.topExpense1,
              hasDebt: situation.hasDebt,
            }
          : null
      }
      decisions={decisions.map((d) => ({
        id: d.id,
        forDate: d.forDate,
        title: d.title,
        status: d.status,
        band: d.band,
        estimatedImpact: d.estimatedImpact,
      }))}
    />
  );
}
