import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import GoalsView from "@/components/goals/GoalsView";

export default async function GoalsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const goals = await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  return (
    <GoalsView
      goals={goals.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon,
        color: g.color,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
      }))}
    />
  );
}
