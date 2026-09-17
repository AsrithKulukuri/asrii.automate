import crypto from "crypto";
import { MetaWebhookPayload, WebhookCommentChangeValue } from "./types";

/**
 * Validates Meta's Webhook verification handshake parameters.
 */
export function verifyWebhookHandshake(
  mode: string | null,
  token: string | null,
  challenge: string | null,
  expectedToken?: string
): { isValid: boolean; challenge?: string } {
  const configuredToken = expectedToken || process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && token && configuredToken && token === configuredToken && challenge) {
    return { isValid: true, challenge };
  }

  return { isValid: false };
}

/**
 * Verifies incoming Meta webhook payload signature using HMAC-SHA256.
 * Meta header: x-hub-signature-256 = sha256=<hex_hash>
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null,
  appSecret?: string
): boolean {
  const secret = appSecret || process.env.META_APP_SECRET;

  if (!secret) {
    // In production, refusing to verify without a secret is essential for security
    if (process.env.NODE_ENV === "production") {
      console.error("META_APP_SECRET is required in production for webhook verification.");
      return false;
    }
    // Sandbox / local dev mode without secret allows development payloads
    return true;
  }

  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }

  const expectedSignature = signatureHeader.slice(7);
  const hmac = crypto.createHmac("sha256", secret);
  const calculatedSignature = hmac.update(rawBody).digest("hex");

  try {
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    const calculatedBuf = Buffer.from(calculatedSignature, "hex");

    if (expectedBuf.length !== calculatedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, calculatedBuf);
  } catch {
    return false;
  }
}

export interface ExtractedCommentEvent {
  eventId: string;
  accountId: string;
  postId: string;
  commentId: string;
  username: string;
  fromId: string;
  text: string;
  timestamp: number;
}

/**
 * Parses normalized Instagram comment events from Meta webhook payload.
 */
export function parseInstagramCommentEvents(payload: MetaWebhookPayload): ExtractedCommentEvent[] {
  const events: ExtractedCommentEvent[] = [];

  if (!payload || !Array.isArray(payload.entry)) {
    return events;
  }

  for (const entry of payload.entry) {
    const accountId = entry.id;

    if (Array.isArray(entry.changes)) {
      for (const change of entry.changes) {
        if (change.field === "comments" || change.field === "feed") {
          const val = change.value as WebhookCommentChangeValue;
          if (val && val.id && val.text) {
            events.push({
              eventId: `evt_${val.id}_${entry.time || Date.now()}`,
              accountId,
              postId: val.media?.id || "post_unknown",
              commentId: val.id,
              username: val.from?.username || "instagram_user",
              fromId: val.from?.id || "ig_user_unknown",
              text: val.text,
              timestamp: val.created_time ? val.created_time * 1000 : entry.time || Date.now(),
            });
          }
        }
      }
    }
  }

  return events;
}
