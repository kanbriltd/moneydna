import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/requireUser";
import { getAnalytics } from "@/lib/analytics";
import { getDailyBriefing } from "@/lib/coachEngine";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const analytics = await getAnalytics(userId);
  if (!analytics.hasData) return NextResponse.json({ error: "No data yet." }, { status: 404 });

  const briefing = await getDailyBriefing(analytics);
  return NextResponse.json(briefing);
}
