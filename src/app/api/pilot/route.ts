import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/requireUser";
import { pilotMetrics } from "@/lib/events";

/**
 * The founder's pilot dashboard data — the three numbers that ARE Hypothesis 001.
 * NOTE: during the closed pilot this is left accessible to any signed-in user for
 * simplicity. Before any wider launch, gate it to founder emails via an allowlist
 * (see README).
 */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(await pilotMetrics());
}
