import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const mode = searchParams.get("mode");
    const workflowId = searchParams.get("workflowId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const whereClause: Record<string, unknown> = {
      workflow: {
        workspaceId: user.workspaceId,
      },
    };

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (mode && mode !== "ALL") {
      whereClause.mode = mode;
    }

    if (workflowId && workflowId !== "ALL") {
      whereClause.workflowId = workflowId;
    }

    const [executions, totalCount, activeWorkflows, messageLogsCount] = await Promise.all([
      prisma.workflowExecution.findMany({
        where: whereClause,
        include: {
          workflow: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.workflowExecution.count({
        where: { workflow: { workspaceId: user.workspaceId } },
      }),
      prisma.workflow.count({
        where: { workspaceId: user.workspaceId, isActive: true },
      }),
      prisma.messageLog.count({
        where: { workspaceId: user.workspaceId, status: "SENT" },
      }),
    ]);

    // Calculate 24h stats
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24hCount = await prisma.workflowExecution.count({
      where: {
        workflow: { workspaceId: user.workspaceId },
        createdAt: { gte: oneDayAgo },
      },
    });

    const successCount = await prisma.workflowExecution.count({
      where: {
        workflow: { workspaceId: user.workspaceId },
        status: "SUCCESS",
      },
    });

    const failedCount = await prisma.workflowExecution.count({
      where: {
        workflow: { workspaceId: user.workspaceId },
        status: "FAILED",
      },
    });

    return NextResponse.json({
      executions: executions.map((e) => ({
        id: e.id,
        workflowId: e.workflowId,
        workflowName: e.workflow?.name || "Deleted Workflow",
        status: e.status,
        mode: e.mode,
        inputPayload: JSON.parse(e.inputPayload),
        executionLogs: JSON.parse(e.executionLogs),
        durationMs: e.durationMs,
        errorMessage: e.errorMessage,
        createdAt: e.createdAt,
      })),
      metrics: {
        totalExecutions: totalCount,
        recent24hCount,
        activeWorkflows,
        successCount,
        failedCount,
        sentReplies: messageLogsCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
