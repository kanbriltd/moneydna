import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import HistoryView from "@/components/history/HistoryView";

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const decisions = await prisma.dailyDecision.findMany({
    where: { userId },
    orderBy: { forDate: "desc" },
    take: 90,
  });

  return (
    <HistoryView
      decisions={decisions.map((d) => ({
        id: d.id,
        forDate: d.forDate,
        title: d.title,
        status: d.status,
        band: d.band,
        estimatedImpact: d.estimatedImpact,
        goalName: d.goalName,
        skipReason: d.skipReason,
      }))}
    />
  );
}
