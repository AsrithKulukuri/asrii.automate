import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user = await getCurrentUser();

  // If not logged in, auto-provision developer demo session for friction-free local dev
  if (!user) {
    user = await getOrCreateDemoSession();
  }

  let account = null;
  try {
    account = await prisma.connectedAccount.findFirst({
      where: {
        workspaceId: user.workspaceId,
        isActive: true,
      },
      select: {
        igUsername: true,
        healthStatus: true,
        isDeveloperToken: true,
      },
    });
  } catch (err) {
    console.warn("[DashboardLayout] DB query notice:", (err as Error).message);
    if (user.isDemo) {
      account = {
        igUsername: "asrii.official",
        healthStatus: "HEALTHY",
        isDeveloperToken: true,
      };
    }
  }

  return (
    <DashboardShell user={user} connectedAccount={account}>
      {children}
    </DashboardShell>
  );
}
