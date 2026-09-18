import { prisma } from "../db";
import { decryptToken } from "../crypto";
import { evaluateCommentCondition, renderMessageTemplate, ConditionConfig } from "./matcher";
import { sendPrivateReply, sendCommentReply } from "../meta/api";

export interface ExecutionStepLog {
  step: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "WARNING" | "INFO";
  durationMs: number;
  description: string;
  details?: Record<string, unknown>;
}

export interface ExecuteWorkflowInput {
  workflowId: string;
  workspaceId: string;
  mode: "MOCK" | "LIVE";
  event: {
    eventId?: string;
    postId: string;
    commentId: string;
    username: string;
    text: string;
    createdTime?: number; // Epoch timestamp ms
  };
  connectedAccountId?: string;
}

export interface ExecutionResult {
  executionId: string;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "UNSUPPORTED";
  mode: "MOCK" | "LIVE";
  workflowName: string;
  durationMs: number;
  timeline: ExecutionStepLog[];
  generatedMessage?: string;
  responsePayload: Record<string, unknown>;
  errorMessage?: string;
}

export async function executeWorkflow(input: ExecuteWorkflowInput): Promise<ExecutionResult> {
  if (input.mode === "LIVE" && process.env.ENABLE_LIVE_META !== "true") {
    throw new Error("Live dispatch is disabled for local testing. Use MOCK mode.");
  }
  const startTime = Date.now();
  const timeline: ExecutionStepLog[] = [];

  function recordStep(
    step: string,
    status: "SUCCESS" | "FAILED" | "SKIPPED" | "WARNING" | "INFO",
    description: string,
    details?: Record<string, unknown>
  ) {
    timeline.push({
      step,
      status,
      durationMs: Date.now() - startTime,
      description,
      details,
    });
  }

  // Step 1: Input event received & normalized
  recordStep("INPUT_RECEIVED", "SUCCESS", "Simulated or webhook event received and validated", {
    postId: input.event.postId,
    commentId: input.event.commentId,
    username: input.event.username,
    commentPreview: input.event.text.slice(0, 40),
  });

  // Step 2: Fetch workflow from database
  const workflow = await prisma.workflow.findUnique({
    where: { id: input.workflowId },
    include: { connectedAccount: true },
  });

  if (!workflow || workflow.workspaceId !== input.workspaceId) {
    recordStep("WORKFLOW_NOT_FOUND", "FAILED", `Workflow with ID ${input.workflowId} not found in database`);
    return {
      executionId: "exec_err_" + Date.now(),
      status: "FAILED",
      mode: input.mode,
      workflowName: "Unknown",
      durationMs: Date.now() - startTime,
      timeline,
      responsePayload: { error: "Workflow not found" },
      errorMessage: "Workflow not found",
    };
  }

  recordStep("WORKFLOW_LOADED", "SUCCESS", `Loaded workflow "${workflow.name}"`, {
    isActive: workflow.isActive,
    workspaceId: workflow.workspaceId,
  });

  // Step 3: Check active status
  if (!workflow.isActive) {
    recordStep("WORKFLOW_INACTIVE", "SKIPPED", "Workflow is currently paused/inactive. Execution skipped.");
    const durationMs = Date.now() - startTime;
    return {
      executionId: "exec_skipped_" + Date.now(),
      status: "SKIPPED",
      mode: input.mode,
      workflowName: workflow.name,
      durationMs,
      timeline,
      responsePayload: { reason: "Workflow is inactive" },
    };
  }

  // Parse JSON configs
  let conditionConfig: ConditionConfig = { matchType: "CONTAINS_ANY" };
  let actionConfig: { type: string; template: string } = {
    type: "PRIVATE_REPLY",
    template: "Hey {{username}}! Thanks for your comment.",
  };

  try {
    conditionConfig = JSON.parse(workflow.conditionConfig);
  } catch {
    // fallback default
  }

  try {
    actionConfig = JSON.parse(workflow.actionConfig);
  } catch {
    // fallback default
  }

  // Step 4: Condition Matching
  const matchResult = evaluateCommentCondition(
    input.event.text,
    input.event.postId,
    conditionConfig,
    JSON.parse(workflow.triggerConfig).postId
  );

  if (!matchResult.matched) {
    recordStep("CONDITION_EVALUATED", "SKIPPED", `Condition not met: ${matchResult.reason}`, {
      matchType: conditionConfig.matchType,
      reason: matchResult.reason,
    });

    const durationMs = Date.now() - startTime;

    // Persist skipped execution in DB
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        triggerEventId: input.event.eventId || `evt_${input.event.commentId}`,
        status: "SKIPPED",
        mode: input.mode,
        inputPayload: JSON.stringify({
          postId: input.event.postId,
          commentId: input.event.commentId,
          username: input.event.username,
          text: input.event.text,
        }),
        executionLogs: JSON.stringify(timeline),
        durationMs,
      },
    });

    return {
      executionId: execution.id,
      status: "SKIPPED",
      mode: input.mode,
      workflowName: workflow.name,
      durationMs,
      timeline,
      responsePayload: {
        matched: false,
        reason: matchResult.reason,
      },
    };
  }

  recordStep("CONDITION_MATCHED", "SUCCESS", `Condition matched: ${matchResult.reason}`, {
    matchedKeyword: matchResult.matchedKeyword,
    matchType: conditionConfig.matchType,
  });

  // Step 5: Render Message Template
  let messageText = renderMessageTemplate(actionConfig.template, {
    username: input.event.username,
    comment: input.event.text,
  });

  // Meta Instagram Messaging Rule: Max 1,000 characters per message
  if (messageText.length > 1000) {
    recordStep("MESSAGE_TRUNCATED", "WARNING", `Message length (${messageText.length}) exceeds Meta 1,000 character limit. Safely truncated to comply with API standards.`, {
      originalLength: messageText.length,
      truncatedLength: 1000,
    });
    messageText = messageText.slice(0, 997) + "...";
  }

  recordStep("MESSAGE_COMPOSED", "SUCCESS", "Generated message from template with variable substitution", {
    characterCount: messageText.length,
    renderedPreview: messageText.slice(0, 60) + (messageText.length > 60 ? "..." : ""),
  });

  // Step 6: Policy Validation (Meta Rules)
  // Check 7-day rule for private replies
  if (input.event.createdTime) {
    const ageInDays = (Date.now() - input.event.createdTime) / (1000 * 60 * 60 * 24);
    if (ageInDays > 7) {
      recordStep("POLICY_CHECK", "FAILED", "Meta Policy Violation: Comment was created more than 7 days ago. Private replies outside 7-day window are prohibited.", {
        commentAgeDays: ageInDays.toFixed(1),
        maxAllowedDays: 7,
      });

      const durationMs = Date.now() - startTime;
      const execution = await prisma.workflowExecution.create({
        data: {
          workflowId: workflow.id,
          triggerEventId: input.event.eventId || `evt_${input.event.commentId}`,
          status: "UNSUPPORTED",
          mode: input.mode,
          inputPayload: JSON.stringify(input.event),
          executionLogs: JSON.stringify(timeline),
          durationMs,
          errorMessage: "Comment is older than 7 days (Meta private reply window expired)",
        },
      });

      return {
        executionId: execution.id,
        status: "UNSUPPORTED",
        mode: input.mode,
        workflowName: workflow.name,
        durationMs,
        timeline,
        generatedMessage: messageText,
        responsePayload: {
          error: "Outside 7-day window",
          metaCode: 2534022,
        },
        errorMessage: "Comment is older than 7 days",
      };
    }
  }

  // Check 1-reply per comment deduplication in our message logs
  const existingReply = await prisma.messageLog.findFirst({
    where: {
      workspaceId: input.workspaceId,
      commentId: input.event.commentId,
      status: "SENT",
    },
  });

  if (existingReply) {
    recordStep("POLICY_CHECK", "FAILED", "Meta Policy Violation: Comment has already received a private reply. Meta strictly allows 1 private reply per comment.", {
      existingReplyId: existingReply.metaMessageId || existingReply.id,
      sentAt: existingReply.sentAt,
    });

    const durationMs = Date.now() - startTime;
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        triggerEventId: input.event.eventId || `evt_${input.event.commentId}`,
        status: "UNSUPPORTED",
        mode: input.mode,
        inputPayload: JSON.stringify(input.event),
        executionLogs: JSON.stringify(timeline),
        durationMs,
        errorMessage: "Comment has already received a private reply (#10900)",
      },
    });

    return {
      executionId: execution.id,
      status: "UNSUPPORTED",
      mode: input.mode,
      workflowName: workflow.name,
      durationMs,
      timeline,
      generatedMessage: messageText,
      responsePayload: {
        error: "Comment already replied to",
        metaCode: 10900,
      },
      errorMessage: "Comment has already received a private reply",
    };
  }

  recordStep("POLICY_VALIDATION", "SUCCESS", "Passed Meta Private Reply rules (within 7-day window, no duplicate reply detected)");

  // Step 7: Action Execution (MOCK vs LIVE)
  let responsePayload: Record<string, unknown> = {};
  let executionStatus: "SUCCESS" | "FAILED" = "SUCCESS";
  let errorMessage: string | undefined;
  let createdMessageLogId: string | null = null;

  if (input.mode === "MOCK") {
    // Guaranteed: NO network call to Meta API in Mock Mode
    recordStep("DISPATCH_MOCK", "SUCCESS", "Simulated private reply delivery. No live network call made to Meta Graph API.", {
      mode: "MOCK_SIMULATION",
      simulatedRecipient: input.event.commentId,
      networkRequest: false,
    });

    recordStep("PUBLIC_COMMENT_REPLY_MOCK", "SUCCESS", "Simulated public reply: Done! Sent you a DM 📩");
    responsePayload = {
      publicReply: { status: "SIMULATED", message: "Done! Sent you a DM 📩" },
      mode: "MOCK",
      status: "SUCCESS",
      workflow: workflow.name,
      matched: true,
      action: "PRIVATE_REPLY_SIMULATION",
      recipient: {
        comment_id: input.event.commentId,
        username: input.event.username,
      },
      message: messageText,
      networkRequest: false,
      simulatedAt: new Date().toISOString(),
    };
  } else {
    // LIVE MODE: Call official Meta Graph API
    recordStep("DISPATCH_LIVE", "INFO", "Dispatching live private reply via Meta Graph API v21.0...");

    const account = workflow.connectedAccount;
    if (!account || !account.isActive || account.healthStatus !== "HEALTHY") {
      recordStep("DISPATCH_LIVE", "FAILED", "No Instagram account connected to this workflow");
      executionStatus = "FAILED";
      errorMessage = "Connected Instagram account required for live execution";
    } else {
      try {
        const decryptedToken = decryptToken(
          account.encryptedAccessToken,
          account.iv,
          account.authTag
        );

        const metaResponse = await sendPrivateReply(
          account.igUserId,
          input.event.commentId,
          messageText,
          decryptedToken
        );

        recordStep("DISPATCH_LIVE", "SUCCESS", "Meta Graph API confirmed message delivery", {
          recipientId: metaResponse.recipient_id,
          metaMessageId: metaResponse.message_id,
        });

        responsePayload = {
          mode: "LIVE",
          status: "SUCCESS",
          metaMessageId: metaResponse.message_id,
          recipientId: metaResponse.recipient_id,
          accountUsername: account.igUsername,
        };

        // Record message log
        const messageLog = await prisma.messageLog.create({
          data: {
            workspaceId: input.workspaceId,
            workflowExecutionId: undefined, // updated after execution creation below
            recipientId: metaResponse.recipient_id,
            commentId: input.event.commentId,
            messageType: "PRIVATE_REPLY",
            messageContent: messageText,
            metaMessageId: metaResponse.message_id,
            status: "SENT",
          },
        });
        createdMessageLogId = messageLog.id;

        // A failed public acknowledgement must not turn a delivered DM into a failed DM.
        try {
          const publicReply = await sendCommentReply(input.event.commentId, "Done! Sent you a DM 📩", decryptedToken);
          responsePayload.publicReply = { status: "SUCCESS", commentId: publicReply.id };
          recordStep("PUBLIC_COMMENT_REPLY", "SUCCESS", "Posted: Done! Sent you a DM 📩", { commentId: publicReply.id });
        } catch {
          responsePayload.publicReply = { status: "FAILED" };
          recordStep("PUBLIC_COMMENT_REPLY", "WARNING", "DM sent, but the public comment reply failed. Check Instagram comment permissions and restrictions.");
        }
      } catch (err: unknown) {
        executionStatus = "FAILED";
        const classified =
          typeof err === "object" && err !== null && "title" in err
            ? (err as unknown as { title: string; description: string })
            : { title: "Meta API Call Failed", description: (err as Error).message };

        errorMessage = `${classified.title}: ${classified.description}`;

        recordStep("DISPATCH_LIVE", "FAILED", errorMessage, {
          classifiedError: classified,
        });

        responsePayload = {
          mode: "LIVE",
          status: "FAILED",
          error: errorMessage,
        };
      }
    }
  }

  const durationMs = Date.now() - startTime;

  // Persist execution log in DB
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      triggerEventId: input.event.eventId || `evt_${input.event.commentId}`,
      status: executionStatus,
      mode: input.mode,
      inputPayload: JSON.stringify({
        postId: input.event.postId,
        commentId: input.event.commentId,
        username: input.event.username,
        text: input.event.text,
      }),
      executionLogs: JSON.stringify(timeline),
      durationMs,
      errorMessage,
    },
  });

  // Link message log with the newly created execution record
  if (createdMessageLogId) {
    await prisma.messageLog.update({
      where: { id: createdMessageLogId },
      data: { workflowExecutionId: execution.id },
    }).catch(() => {});
  }

  return {
    executionId: execution.id,
    status: executionStatus,
    mode: input.mode,
    workflowName: workflow.name,
    durationMs,
    timeline,
    generatedMessage: messageText,
    responsePayload,
    errorMessage,
  };
}
