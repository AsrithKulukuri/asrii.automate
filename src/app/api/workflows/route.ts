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
    console.warn("[GET /api/workflows] DB query failed, returning demo fallback:", (error as Error).message);
    return NextResponse.json({ workflows: FALLBACK_DEMO_WORKFLOWS });
  }
}

const FALLBACK_DEMO_WORKFLOWS = [
  {
    id: "wf_demo_price_inquiry",
    workspaceId: "ws_demo_developer_01",
    name: "Price Inquiry Auto-Reply",
    description: "Sends permitted private reply when someone asks about pricing or rates.",
    isActive: true,
    triggerConfig: JSON.stringify({ type: "COMMENT_RECEIVED", postId: null }),
    conditionConfig: JSON.stringify({
      matchType: "CONTAINS_ANY",
      keywords: ["price", "cost", "how much", "pricing", "rate"],
      excludedKeywords: ["spam", "free scam", "bot"],
      caseSensitive: false,
    }),
    actionConfig: JSON.stringify({
      type: "PRIVATE_REPLY",
      template: "Hey {{username}}! Thanks for your interest in Asrii Automate. Pricing starts at $49/mo. Check your inbox for the complete breakdown!",
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    connectedAccount: {
      id: "acc_demo_01",
      igUsername: "asrii.official",
      profilePictureUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
    },
    executions: [
      {
        id: "exec_seed_1",
        status: "SUCCESS",
        mode: "MOCK",
        durationMs: 14,
        createdAt: new Date().toISOString(),
      },
    ],
    _count: { executions: 1 },
  },
  {
    id: "wf_demo_vip_access",
    workspaceId: "ws_demo_developer_01",
    name: "VIP Early Access Invite",
    description: "Invites commenters who mention VIP or Beta into private beta access.",
    isActive: true,
    triggerConfig: JSON.stringify({ type: "COMMENT_RECEIVED", postId: null }),
    conditionConfig: JSON.stringify({
      matchType: "CONTAINS_ANY",
      keywords: ["vip", "early access", "beta", "invite"],
      excludedKeywords: ["fake"],
      caseSensitive: false,
    }),
    actionConfig: JSON.stringify({
      type: "PRIVATE_REPLY",
      template: "Hey {{username}}! We're thrilled to welcome you to the Asrii VIP beta. Your private access code has been dispatched.",
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    connectedAccount: {
      id: "acc_demo_01",
      igUsername: "asrii.official",
      profilePictureUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
    },
    executions: [
      {
        id: "exec_seed_2",
        status: "SUCCESS",
        mode: "MOCK",
        durationMs: 9,
        createdAt: new Date().toISOString(),
      },
    ],
    _count: { executions: 1 },
  },
];

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
