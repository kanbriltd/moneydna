import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import AnalyticsView from "@/components/analytics/AnalyticsView";
import EmptyState from "@/components/layout/EmptyState";

export default async function AnalyticsPage() {
  const session = await auth();
  const data = await getAnalytics(session!.user!.id);

  if (!data.hasData) {
    return (
      <EmptyState
        title="Nothing to analyze yet"
        body="Upload a statement to see your spending DNA, money-flow Sankey, daily heatmap and transaction galaxy."
      />
    );
  }

  return <AnalyticsView data={data} />;
}
