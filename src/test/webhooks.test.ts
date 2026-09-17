import { describe, it, expect } from "vitest";
import crypto from "crypto";
import {
  verifyWebhookHandshake,
  verifyWebhookSignature,
  parseInstagramCommentEvents,
} from "../lib/meta/webhooks";
import { MetaWebhookPayload } from "../lib/meta/types";

describe("Meta Instagram Webhook Ingestion & Security", () => {
  const TEST_VERIFY_TOKEN = "test_asrii_verify_token_123";
  const TEST_APP_SECRET = "test_meta_app_secret_abc123";

  it("should validate a valid Meta webhook verification handshake", () => {
    const handshake = verifyWebhookHandshake(
      "subscribe",
      TEST_VERIFY_TOKEN,
      "challenge_code_987654321",
      TEST_VERIFY_TOKEN
    );

    expect(handshake.isValid).toBe(true);
    expect(handshake.challenge).toBe("challenge_code_987654321");
  });

  it("should reject an invalid verify token during handshake", () => {
    const handshake = verifyWebhookHandshake(
      "subscribe",
      "wrong_token",
      "challenge_code_987654321",
      TEST_VERIFY_TOKEN
    );

    expect(handshake.isValid).toBe(false);
    expect(handshake.challenge).toBeUndefined();
  });

  it("should verify a valid HMAC-SHA256 signature in x-hub-signature-256 header", () => {
    const payload = JSON.stringify({ object: "instagram", entry: [] });
    const hmac = crypto.createHmac("sha256", TEST_APP_SECRET).update(payload).digest("hex");
    const signatureHeader = `sha256=${hmac}`;

    const isValid = verifyWebhookSignature(payload, signatureHeader, TEST_APP_SECRET);
    expect(isValid).toBe(true);
  });

  it("should reject a tampered or forged webhook payload", () => {
    const originalPayload = JSON.stringify({ object: "instagram", entry: [] });
    const hmac = crypto.createHmac("sha256", TEST_APP_SECRET).update(originalPayload).digest("hex");
    const signatureHeader = `sha256=${hmac}`;

    const tamperedPayload = JSON.stringify({ object: "instagram", entry: [{ id: "forged" }] });

    const isValid = verifyWebhookSignature(tamperedPayload, signatureHeader, TEST_APP_SECRET);
    expect(isValid).toBe(false);
  });

  it("should extract comment events correctly from standard Meta webhook payload", () => {
    const mockPayload: MetaWebhookPayload = {
      object: "instagram",
      entry: [
        {
          id: "17841400012345678",
          time: 1710000000,
          changes: [
            {
              field: "comments",
              value: {
                id: "comment_999",
                text: "Can you send me the price?",
                from: {
                  id: "ig_user_456",
                  username: "jessica_buyer",
                },
                media: {
                  id: "post_111",
                },
                created_time: 1710000000,
              },
            },
          ],
        },
      ],
    };

    const events = parseInstagramCommentEvents(mockPayload);
    expect(events.length).toBe(1);
    expect(events[0].commentId).toBe("comment_999");
    expect(events[0].username).toBe("jessica_buyer");
    expect(events[0].text).toBe("Can you send me the price?");
    expect(events[0].postId).toBe("post_111");
  });

  it("normalizes entry timestamps and keeps retry event IDs stable", () => {
    const payload: MetaWebhookPayload = {object: "instagram", entry: [{id: "account", time: 1710000000, changes: [{field: "comments", value: {id: "comment", text: "link", from: {id: "person", username: "tester"}, media: {id: "reel"}}}]}]};
    const first = parseInstagramCommentEvents(payload)[0];
    expect(first.timestamp).toBe(1710000000000);
    payload.entry[0].time = 1710000005000;
    const retry = parseInstagramCommentEvents(payload)[0];
    expect(retry.timestamp).toBe(1710000005000);
    expect(retry.eventId).toBe(first.eventId);
  });
});
