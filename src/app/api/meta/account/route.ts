import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());

    const account = await prisma.connectedAccount.findFirst({
      where: {
        workspaceId: user.workspaceId,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!account) {
      return NextResponse.json({ connected: false, account: null });
    }

    return NextResponse.json({
      connected: true,
      account: {
        id: account.id,
        igUserId: account.igUserId,
        igUsername: account.igUsername,
        igName: account.igName,
        profilePictureUrl: account.profilePictureUrl,
        healthStatus: account.healthStatus,
        isDeveloperToken: account.isDeveloperToken,
        scopes: account.scopes.split(","),
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
