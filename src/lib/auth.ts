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

export const DEFAULT_DEMO_SESSION: SessionUser = {
  id: DEMO_USER_ID,
  email: "developer@asriiautomate.local",
  name: "Asrii Developer",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  workspaceId: DEMO_WORKSPACE_ID,
  workspaceName: "Asrii Automation Studio",
  role: "OWNER",
  isDemo: true,
};

/**
 * Retrieves the currently authenticated user and active workspace.
 * Automatically provisions/retrieves developer session if authenticated or in demo mode.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("asrii_session");

  // Check if session cookie exists
  const userId = sessionCookie?.value;

  if (!userId) {
    return null;
  }

  // Fast-path / resilient fallback for demo developer session
  if (userId === DEMO_USER_ID) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberships: {
            include: { workspace: true },
          },
        },
      });

      if (user && user.memberships.length > 0) {
        const primaryMembership = user.memberships[0];
        return {
          id: user.id,
          email: user.email,
          name: user.name || "Developer",
          avatarUrl: user.avatarUrl,
          workspaceId: primaryMembership.workspaceId,
          workspaceName: primaryMembership.workspace.name,
          role: primaryMembership.role,
          isDemo: true,
        };
      }
    } catch {
      // Database not reachable or uninitialized; fall back to memory demo session
    }
    return DEFAULT_DEMO_SESSION;
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
      isDemo: false,
    };
  } catch {
    return null;
  }
}

/**
 * Ensures a demo user and workspace exists and returns its session.
 * Gracefully falls back to in-memory demo session if database is uninitialized or read-only.
 */
export async function getOrCreateDemoSession(): Promise<SessionUser> {
  try {
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
  } catch (err) {
    console.warn("[getOrCreateDemoSession] Using in-memory demo session fallback:", (err as Error).message);
    return DEFAULT_DEMO_SESSION;
  }
}
