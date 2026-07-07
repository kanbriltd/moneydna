import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import SimulatorView from "@/components/simulator/SimulatorView";

export default async function SimulatorPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const a = await getAnalytics(userId);

  // Suggest a starting monthly: this month's net saving, else 10% of income, else 5,000.
  const suggested =
    Math.round(a.kpis.net) > 0
      ? Math.round(a.kpis.net)
      : a.kpis.income > 0
      ? Math.round(a.kpis.income * 0.1)
      : 5000;

  return <SimulatorView suggestedMonthly={Math.max(500, suggested)} />;
}
