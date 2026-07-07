import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TodayView from "@/components/today/TodayView";

export default async function TodayPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [user, profile, situation] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, createdAt: true } }),
    prisma.companionProfile.findUnique({ where: { userId } }),
    prisma.moneySituation.findUnique({ where: { userId } }),
  ]);

  const isSunday = new Date().getDay() === 0;
  const dayTogether = user
    ? Math.max(1, Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000) + 1)
    : 1;

  return (
    <TodayView
      firstName={(user?.name ?? "there").split(" ")[0]}
      needsDiscovery={!profile?.discoveryComplete}
      needsSituation={!situation}
      dnaLabel={profile?.dnaLabel ?? null}
      discipline={profile?.traitDiscipline ?? 50}
      showWeekly={isSunday}
      dayTogether={dayTogether}
      memoryQuote={profile?.futureVision ?? null}
    />
  );
}
