import { prisma } from "./db";
import { encryptToken } from "./crypto";
import { DEMO_USER_ID, DEMO_WORKSPACE_ID } from "./auth";

export async function seedDemoData() {
  // 1. Ensure Demo User
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "developer@asriiautomate.local",
      name: "Asrii Developer",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
  });

  // 2. Ensure Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: DEMO_WORKSPACE_ID },
    update: {},
    create: {
      id: DEMO_WORKSPACE_ID,
      name: "Asrii Automation Studio",
      slug: "asrii-studio",
      ownerId: user.id,
    },
  });

  // 3. Workspace Member
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  // 4. Sample Connected Account (with AES-256-GCM encrypted token)
  const simulatedToken = "EAABwzLixnjYBAOd8k249301kdsl2984kdfj02384jsdfk3894";
  const encrypted = encryptToken(simulatedToken);

  const connectedAccount = await prisma.connectedAccount.upsert({
    where: {
      workspaceId_igUserId: {
        workspaceId: workspace.id,
        igUserId: "17841400012345678",
      },
    },
    update: {
      healthStatus: "HEALTHY",
      isActive: true,
    },
    create: {
      workspaceId: workspace.id,
      igUserId: "17841400012345678",
      igUsername: "asrii.official",
      igName: "Asrii Automate Official",
      profilePictureUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80",
      encryptedAccessToken: encrypted.encryptedAccessToken,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      scopes: "instagram_basic,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_read_engagement",
      isActive: true,
      healthStatus: "HEALTHY",
      isDeveloperToken: true,
    },
  });

  // 5. Sample Workflows
  const workflow1 = await prisma.workflow.upsert({
    where: { id: "wf_demo_price_inquiry" },
    update: {},
    create: {
      id: "wf_demo_price_inquiry",
      workspaceId: workspace.id,
      connectedAccountId: connectedAccount.id,
      name: "Price Inquiry Auto-Reply",
      description: "Sends permitted private reply when someone asks about pricing or rates.",
      isActive: true,
      triggerConfig: JSON.stringify({
        type: "COMMENT_RECEIVED",
        postId: null, // Any post
      }),
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
    },
  });

  const workflow2 = await prisma.workflow.upsert({
    where: { id: "wf_demo_vip_access" },
    update: {},
    create: {
      id: "wf_demo_vip_access",
      workspaceId: workspace.id,
      connectedAccountId: connectedAccount.id,
      name: "VIP Early Access Invite",
      description: "Invites commenters who mention VIP or Beta into private beta access.",
      isActive: true,
      triggerConfig: JSON.stringify({
        type: "COMMENT_RECEIVED",
        postId: null,
      }),
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
    },
  });

  // 6. Seed Sample Executions for metrics & activity
  const execCount = await prisma.workflowExecution.count({
    where: { workflowId: workflow1.id },
  });

  if (execCount === 0) {
    await prisma.workflowExecution.create({
      data: {
        workflowId: workflow1.id,
        triggerEventId: "evt_comm_seed_101",
        status: "SUCCESS",
        mode: "MOCK",
        inputPayload: JSON.stringify({
          postId: "post_sample_99",
          commentId: "comment_sample_101",
          username: "sarah_creator",
          text: "What is the price of this SaaS?",
        }),
        executionLogs: JSON.stringify([
          { step: "INPUT_RECEIVED", status: "SUCCESS", durationMs: 2, description: "Simulated comment event received" },
          { step: "WORKFLOW_LOADED", status: "SUCCESS", durationMs: 5, description: "Loaded workflow Price Inquiry Auto-Reply" },
          { step: "CONDITION_MATCHED", status: "SUCCESS", durationMs: 8, description: 'Matched keyword "price"' },
          { step: "POLICY_VALIDATION", status: "SUCCESS", durationMs: 10, description: "Within 7-day private reply window" },
          { step: "DISPATCH_MOCK", status: "SUCCESS", durationMs: 14, description: "Mock private reply generated" },
        ]),
        durationMs: 14,
      },
    });

    await prisma.workflowExecution.create({
      data: {
        workflowId: workflow2.id,
        triggerEventId: "evt_comm_seed_102",
        status: "SUCCESS",
        mode: "MOCK",
        inputPayload: JSON.stringify({
          postId: "post_sample_88",
          commentId: "comment_sample_102",
          username: "alex_founder",
          text: "Can I get VIP early access?",
        }),
        executionLogs: JSON.stringify([
          { step: "INPUT_RECEIVED", status: "SUCCESS", durationMs: 1, description: "Simulated comment event received" },
          { step: "CONDITION_MATCHED", status: "SUCCESS", durationMs: 4, description: 'Matched keyword "vip"' },
          { step: "DISPATCH_MOCK", status: "SUCCESS", durationMs: 9, description: "Mock private reply generated" },
        ]),
        durationMs: 9,
      },
    });

    // Seed sample webhook event
    await prisma.webhookEvent.create({
      data: {
        workspaceId: workspace.id,
        eventId: "evt_comm_seed_101",
        objectType: "instagram",
        rawPayload: JSON.stringify({
          object: "instagram",
          entry: [{ id: "17841400012345678", time: Date.now() }],
        }),
        status: "PROCESSED",
      },
    });
  }

  return { workspace, connectedAccount, workflows: [workflow1, workflow2] };
}
