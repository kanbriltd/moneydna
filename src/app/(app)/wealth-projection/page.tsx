import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import WealthProjectionView from "@/components/simulator/WealthProjectionView";

export default async function WealthProjectionPage() {
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

  return <WealthProjectionView suggestedMonthly={Math.max(500, suggested)} />;
}
