import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());
    const { accountId } = await request.json().catch(() => ({ accountId: undefined }));

    if (accountId) {
      await prisma.connectedAccount.deleteMany({
        where: {
          id: accountId,
          workspaceId: user.workspaceId,
        },
      });
    } else {
      await prisma.connectedAccount.deleteMany({
        where: {
          workspaceId: user.workspaceId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "ACCOUNT_DISCONNECTED",
        targetType: "ACCOUNT",
        targetId: accountId || "all",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
