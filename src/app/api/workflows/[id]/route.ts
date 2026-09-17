import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
      include: {
        connectedAccount: {
          select: {
            id: true,
            igUsername: true,
            profilePictureUrl: true,
          },
        },
        executions: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json({
      workflow: {
        ...workflow,
        triggerConfig: JSON.parse(workflow.triggerConfig),
        conditionConfig: JSON.parse(workflow.conditionConfig),
        actionConfig: JSON.parse(workflow.actionConfig),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());
    const body = await request.json();

    const existing = await prisma.workflow.findFirst({
      where: { id, workspaceId: user.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const updated = await prisma.workflow.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : existing.name,
        description: body.description !== undefined ? body.description : existing.description,
        isActive: body.isActive !== undefined ? body.isActive : existing.isActive,
        triggerConfig: body.triggerConfig ? JSON.stringify(body.triggerConfig) : existing.triggerConfig,
        conditionConfig: body.conditionConfig ? JSON.stringify(body.conditionConfig) : existing.conditionConfig,
        actionConfig: body.actionConfig ? JSON.stringify(body.actionConfig) : existing.actionConfig,
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "WORKFLOW_UPDATED",
        targetType: "WORKFLOW",
        targetId: id,
        metadata: JSON.stringify({ name: updated.name, isActive: updated.isActive }),
      },
    });

    return NextResponse.json({
      workflow: {
        ...updated,
        triggerConfig: JSON.parse(updated.triggerConfig),
        conditionConfig: JSON.parse(updated.conditionConfig),
        actionConfig: JSON.parse(updated.actionConfig),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());

    await prisma.workflow.deleteMany({
      where: { id, workspaceId: user.workspaceId },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "WORKFLOW_DELETED",
        targetType: "WORKFLOW",
        targetId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
