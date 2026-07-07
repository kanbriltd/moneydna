import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import MobileTabBar from "@/components/layout/MobileTabBar";
import AmbientBackground from "@/components/ui/AmbientBackground";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="md-page-bg" style={{ display: "flex" }}>
      <AmbientBackground seed={(user.name?.charCodeAt(0) ?? 7) + user.name.length} />
      <div style={{ position: "relative", zIndex: 2, display: "flex", width: "100%" }}>
        <Sidebar name={user.name} businessName={user.businessName} streakMonths={user.streakMonths} />
        <div className="md-app-content" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
