import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SettingsView from "@/components/settings/SettingsView";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [user, situation] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, businessName: true } }),
    prisma.moneySituation.findUnique({ where: { userId } }),
  ]);

  return (
    <SettingsView
      account={{ name: user?.name ?? "", email: user?.email ?? "", businessName: user?.businessName ?? null }}
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
    />
  );
}
