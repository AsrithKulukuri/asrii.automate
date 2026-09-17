import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";
import { z } from "zod";

const WorkflowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  triggerConfig: z.object({
    type: z.literal("COMMENT_RECEIVED").default("COMMENT_RECEIVED"),
    postId: z.string().nullable().optional(),
  }),
  conditionConfig: z.object({
    matchType: z.enum([
      "ANY_COMMENT",
      "CONTAINS_ANY",
      "CONTAINS_ALL",
      "EXACT_MATCH",
      "STARTS_WITH",
      "REGEX",
    ]),
    keywords: z.array(z.string()).default([]),
    excludedKeywords: z.array(z.string()).default([]),
    caseSensitive: z.boolean().default(false),
    postId: z.string().nullable().optional(),
  }),
  actionConfig: z.object({
    type: z.enum(["PRIVATE_REPLY", "DIRECT_MESSAGE"]).default("PRIVATE_REPLY"),
    template: z.string().min(1, "Message template cannot be empty"),
  }),
});

export async function GET() {
  try {
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());

    const workflows = await prisma.workflow.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        connectedAccount: {
          select: {
            id: true,
            igUsername: true,
            profilePictureUrl: true,
          },
        },
        executions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            mode: true,
            durationMs: true,
            createdAt: true,
          },
        },
        _count: {
          select: { executions: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ workflows });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());
    const body = await request.json();

    const parsed = WorkflowSchema.parse(body);

    const connectedAccount = await prisma.connectedAccount.findFirst({
      where: { workspaceId: user.workspaceId, isActive: true },
    });

    const workflow = await prisma.workflow.create({
      data: {
        workspaceId: user.workspaceId,
        connectedAccountId: connectedAccount?.id,
        name: parsed.name,
        description: parsed.description,
        isActive: parsed.isActive,
        triggerConfig: JSON.stringify(parsed.triggerConfig),
        conditionConfig: JSON.stringify(parsed.conditionConfig),
        actionConfig: JSON.stringify(parsed.actionConfig),
      },
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "WORKFLOW_CREATED",
        targetType: "WORKFLOW",
        targetId: workflow.id,
        metadata: JSON.stringify({ name: workflow.name }),
      },
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation error" }, { status: 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
