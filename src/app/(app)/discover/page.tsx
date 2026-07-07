import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DiscoverView from "@/components/companion/DiscoverView";

export default async function DiscoverPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const profile = await prisma.companionProfile.findUnique({ where: { userId } });

  return (
    <DiscoverView
      alreadyDone={profile?.discoveryComplete ?? false}
      existingDna={
        profile?.discoveryComplete
          ? { label: profile.dnaLabel ?? "", summary: profile.dnaSummary ?? "", confidence: profile.dnaConfidence }
          : null
      }
    />
  );
}
