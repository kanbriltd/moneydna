import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAnalytics } from "@/lib/analytics";
import CoachView from "@/components/coach/CoachView";

export default async function CoachPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const [messages, analytics] = await Promise.all([
    prisma.chatMessage.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    getAnalytics(userId),
  ]);

  return (
    <CoachView
      initialMessages={messages.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }))}
      hasData={analytics.hasData}
    />
  );
}
