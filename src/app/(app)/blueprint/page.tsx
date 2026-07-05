import { auth } from "@/auth";
import { getAnalytics } from "@/lib/analytics";
import BlueprintView from "@/components/blueprint/BlueprintView";

export default async function BlueprintPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const a = await getAnalytics(userId);

  return <BlueprintView detectedIncome={Math.round(a.kpis.income) || 0} userName={a.userName || "there"} />;
}
