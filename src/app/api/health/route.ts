import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isVaultConfigured } from "@/lib/crypto";

const serverStartTime = Date.now();

/**
 * GET /api/health
 * Production health and readiness monitoring endpoint.
 * Returns 200 OK if core services (database, vault) are operational.
 */
export async function GET() {
  const checks: Record<string, { status: "UP" | "DOWN" | "WARNING"; latencyMs?: number; message?: string }> = {};
  let overallHealthy = true;

  // 1. Database Health Check
  const dbStart = Date.now();
  try {
    // Quick probe to verify database connectivity
    await prisma.workspace.count();
    checks.database = {
      status: "UP",
      latencyMs: Date.now() - dbStart,
    };
  } catch (dbError) {
    overallHealthy = false;
    checks.database = {
      status: "DOWN",
      latencyMs: Date.now() - dbStart,
      message: (dbError as Error).message,
    };
  }

  // 2. Encryption Vault Check
  const vaultReady = isVaultConfigured();
  if (vaultReady) {
    checks.vault = { status: "UP" };
  } else if (process.env.NODE_ENV === "production") {
    overallHealthy = false;
    checks.vault = {
      status: "DOWN",
      message: "TOKEN_ENCRYPTION_KEY or META_APP_SECRET must be set in production",
    };
  } else {
    checks.vault = {
      status: "WARNING",
      message: "Using development fallback encryption key. Configure TOKEN_ENCRYPTION_KEY for production.",
    };
  }

  // 3. Meta API Configuration Check
  const hasMetaAppId = Boolean(process.env.META_APP_ID && process.env.META_APP_ID !== "your_meta_app_id");
  const hasMetaSecret = Boolean(process.env.META_APP_SECRET && process.env.META_APP_SECRET !== "your_meta_app_secret");
  const hasVerifyToken = Boolean(process.env.META_VERIFY_TOKEN);

  checks.metaIntegration = {
    status: hasMetaAppId && hasMetaSecret && hasVerifyToken ? "UP" : "WARNING",
    message: !hasMetaAppId || !hasMetaSecret
      ? "Meta App credentials incomplete; live OAuth/webhooks require META_APP_ID and META_APP_SECRET."
      : "Configured",
  };

  const statusCode = overallHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: overallHealthy ? "healthy" : "degraded",
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor((Date.now() - serverStartTime) / 1000),
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: statusCode }
  );
}
