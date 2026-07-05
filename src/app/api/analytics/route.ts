import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/requireUser";
import { getAnalytics } from "@/lib/analytics";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const data = await getAnalytics(userId);
  return NextResponse.json(data);
}
