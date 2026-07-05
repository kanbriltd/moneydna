import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import { runWhatIf } from "@/lib/whatIf";
import SimulatorView from "@/components/simulator/SimulatorView";
import EmptyState from "@/components/layout/EmptyState";

export default async function SimulatorPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const analytics = await getAnalytics(userId);

  if (!analytics.hasData) {
    return (
      <EmptyState
        title="No statement yet"
        body="Upload a statement (or use the sample dataset) and you'll be able to simulate what-if scenarios against your real numbers."
      />
    );
  }

  const initial = await runWhatIf(userId, {});
  return <SimulatorView initial={initial} />;
}
