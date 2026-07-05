import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import DashboardView from "@/components/dashboard/DashboardView";
import EmptyState from "@/components/layout/EmptyState";

export default async function DashboardPage() {
  const session = await auth();
  const data = await getAnalytics(session!.user!.id);

  if (!data.hasData) {
    return (
      <EmptyState
        title="No statement yet"
        body="Upload an M-PESA, bank, SACCO or credit-card statement (or use the sample dataset) and your command center will populate instantly."
      />
    );
  }

  return <DashboardView data={data} />;
}
