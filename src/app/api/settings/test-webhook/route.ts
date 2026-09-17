import { NextResponse } from "next/server";
import { verifyWebhookHandshake } from "@/lib/meta/webhooks";

export async function POST() {
  const verifyToken = process.env.META_VERIFY_TOKEN || "asrii_automate_verify_token_dev";
  const testChallenge = "challenge_ping_" + Math.random().toString(36).substring(7);

  const result = verifyWebhookHandshake(
    "subscribe",
    verifyToken,
    testChallenge,
    verifyToken
  );

  return NextResponse.json({
    success: result.isValid,
    verifiedAt: new Date().toISOString(),
    challengeReceived: result.challenge,
    status: result.isValid ? "VERIFIED_ACTIVE" : "VERIFICATION_FAILED",
    endpoint: "/api/webhooks/instagram",
  });
}
