import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyWebhookHandshake,
  verifyWebhookSignature,
  parseInstagramCommentEvents,
} from "@/lib/meta/webhooks";
import { executeWorkflow } from "@/lib/engine/executor";
import { DEMO_WORKSPACE_ID } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/webhooks/instagram
 * Meta Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verification = verifyWebhookHandshake(mode, token, challenge);

  if (verification.isValid && verification.challenge) {
    // Return plain text challenge as strictly required by Meta
    return new NextResponse(verification.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    { error: "Forbidden: Invalid verification token or parameters" },
    { status: 403 }
  );
}

/**
 * POST /api/webhooks/instagram
 * Ingests incoming Instagram webhook events (comments, messages) with multi-tenant isolation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting protection against volumetric abuse (300 requests / minute)
    const ip = request.headers.get("x-forwarded-for") || "webhook_client";
    const rateCheck = checkRateLimit(`webhook_${ip}`, { limit: 300, windowMs: 60000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded on webhook ingestion" },
        { status: 429, headers: { "Retry-After": Math.ceil(rateCheck.reset / 1000).toString() } }
      );
    }

    const rawBody = await request.text();
    const signatureHeader = request.headers.get("x-hub-signature-256");

    // 2. Verify HMAC-SHA256 signature
    const isValidSignature = verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValidSignature) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid x-hub-signature-256 header" },
        { status: 401 }
      );
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // 3. Extract comment events
    const commentEvents = parseInstagramCommentEvents(payload);
    let processedCount = 0;

    for (const evt of commentEvents) {
      // 4. Multi-Tenant Account & Workspace Resolution
      // Resolve the workspace by finding the connected account matching Meta's accountId
      let workspaceId: string | null = null;
      let matchedAccountId: string | null = null;

      const account = await prisma.connectedAccount.findFirst({
        where: {
          igUserId: evt.accountId,
          isActive: true,
        },
      });

      if (account) {
        workspaceId = account.workspaceId;
        matchedAccountId = account.id;
      } else {
        // Fallback for local development / test sandbox if no production account mapped
        if (process.env.NODE_ENV !== "production" && process.env.ENABLE_LIVE_META !== "true") {
          const fallbackWorkspace = await prisma.workspace.findFirst();
          workspaceId = fallbackWorkspace?.id || DEMO_WORKSPACE_ID;
        } else {
          console.warn(`[Webhook] Unmapped Instagram Account ID received: ${evt.accountId}. Skipping processing.`);
          continue;
        }
      }

      // 5. Deduplication Check
      const existing = await prisma.webhookEvent.findUnique({
        where: { eventId: evt.eventId },
      });

      if (existing) {
        continue; // Skip duplicate event
      }

      // Persist webhook event
      await prisma.webhookEvent.create({
        data: {
          workspaceId,
          eventId: evt.eventId,
          objectType: "instagram",
          rawPayload: JSON.stringify(evt),
          signature: signatureHeader || undefined,
          status: "PROCESSED",
        },
      });

      // 6. Find active workflows matching this workspace and connected account
      const activeWorkflows = await prisma.workflow.findMany({
        where: {
          workspaceId,
          isActive: true,
          OR: [
            { connectedAccountId: matchedAccountId },
            { connectedAccountId: null },
          ],
        },
      });

      // Dispatch to matching workflows
      for (const wf of activeWorkflows) {
        await executeWorkflow({
          workflowId: wf.id,
          workspaceId,
          mode: process.env.ENABLE_LIVE_META === "true" ? "LIVE" : "MOCK",
          event: {
            eventId: evt.eventId,
            postId: evt.postId,
            commentId: evt.commentId,
            username: evt.username,
            text: evt.text,
            createdTime: evt.timestamp,
          },
        });
      }

      processedCount++;
    }

    // Always respond 200 OK fast so Meta does not retry
    return NextResponse.json({ received: true, total: commentEvents.length, processed: processedCount });
  } catch (error) {
    // Log safely without revealing secrets
    console.error("Webhook ingestion error:", (error as Error).message);
    return NextResponse.json(
      { error: "Webhook ingestion failed" },
      { status: 500 }
    );
  }
}
