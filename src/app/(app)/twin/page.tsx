import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import { buildFinancialTwin } from "@/lib/financialTwin";
import FinancialTwinView from "@/components/twin/FinancialTwinView";
import EmptyState from "@/components/layout/EmptyState";

export default async function TwinPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const analytics = await getAnalytics(userId);

  if (!analytics.hasData) {
    return (
      <EmptyState
        title="No statement yet"
        body="Upload a statement (or use the sample dataset) and your Financial Twin will start predicting what happens next."
      />
    );
  }

  const twin = await buildFinancialTwin(userId, analytics);
  return <FinancialTwinView twin={twin} />;
}
