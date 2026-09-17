import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";
import { executeWorkflow } from "@/lib/engine/executor";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());
    const body = await request.json();

    const {
      workflowId,
      mode = "MOCK",
      postId = "post_demo_001",
      commentId = `comment_demo_${Date.now()}`,
      username = "test_customer",
      text,
      confirmedLive = false,
    } = body;

    if (!workflowId) {
      return NextResponse.json({ error: "workflowId is required" }, { status: 400 });
    }

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "Comment text cannot be empty" }, { status: 400 });
    }

    // Safety check: Live mode must be explicitly confirmed
    if (mode === "LIVE" && !confirmedLive) {
      return NextResponse.json(
        { error: "Live execution requires explicit confirmation. Set confirmedLive=true." },
        { status: 400 }
      );
    }

    const result = await executeWorkflow({
      workflowId,
      workspaceId: user.workspaceId,
      mode: mode === "LIVE" ? "LIVE" : "MOCK",
      event: {
        postId: postId.trim(),
        commentId: commentId.trim(),
        username: username.trim().replace(/^@/, ""),
        text: text.trim(),
        createdTime: Date.now(),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "PLAYGROUND_TEST",
        targetType: "WORKFLOW",
        targetId: workflowId,
        metadata: JSON.stringify({
          mode,
          status: result.status,
          username: username.trim(),
        }),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Workflow test execution error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Execution failed" },
      { status: 500 }
    );
  }
}
