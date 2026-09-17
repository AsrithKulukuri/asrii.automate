import { cookies } from "next/headers";
import { prisma } from "./db";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  workspaceId: string;
  workspaceName: string;
  role: string;
  isDemo: boolean;
}

export const DEMO_USER_ID = "usr_demo_developer_01";
export const DEMO_WORKSPACE_ID = "ws_demo_developer_01";

/**
 * Retrieves the currently authenticated user and active workspace.
 * Automatically provisions/retrieves developer session if authenticated or in demo mode.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("asrii_session");

  // Check if session cookie exists
  const userId = sessionCookie?.value;

  // If no session cookie, check for demo developer fallback
  if (!userId) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: { workspace: true },
        },
      },
    });

    if (!user || user.memberships.length === 0) {
      return null;
    }

    const primaryMembership = user.memberships[0];

    return {
      id: user.id,
      email: user.email,
      name: user.name || "Developer",
      avatarUrl: user.avatarUrl,
      workspaceId: primaryMembership.workspaceId,
      workspaceName: primaryMembership.workspace.name,
      role: primaryMembership.role,
      isDemo: user.id === DEMO_USER_ID,
    };
  } catch {
    return null;
  }
}

/**
 * Ensures a demo user and workspace exists and returns its session.
 */
export async function getOrCreateDemoSession(): Promise<SessionUser> {
  let user = await prisma.user.findUnique({
    where: { id: DEMO_USER_ID },
    include: {
      memberships: {
        include: { workspace: true },
      },
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: DEMO_USER_ID,
        email: "developer@asriiautomate.local",
        name: "Asrii Developer",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
      include: {
        memberships: {
          include: { workspace: true },
        },
      },
    });
  }

  let workspace = await prisma.workspace.findUnique({
    where: { id: DEMO_WORKSPACE_ID },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        id: DEMO_WORKSPACE_ID,
        name: "Asrii Automation Studio",
        slug: "asrii-studio",
        ownerId: user.id,
      },
    });

    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        role: "OWNER",
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || "Asrii Developer",
    avatarUrl: user.avatarUrl,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    role: "OWNER",
    isDemo: true,
  };
}
