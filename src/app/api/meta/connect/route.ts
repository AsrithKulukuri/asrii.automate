import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encryptToken, maskToken } from "@/lib/crypto";
import { fetchInstagramAccounts } from "@/lib/meta/api";
import { getCurrentUser, getOrCreateDemoSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = (await getCurrentUser()) || (await getOrCreateDemoSession());
    const body = await request.json();

    const { accessToken, igUserId } = body;
    const isDeveloperToken = true;

    if (!accessToken || typeof accessToken !== "string" || accessToken.trim() === "") {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    }

    const cleanToken = accessToken.trim();
    let discovered;
    try {
      const accounts = await fetchInstagramAccounts(cleanToken);
      discovered = igUserId ? accounts.find((account) => account.id === igUserId) : accounts[0];
      if (!discovered) throw new Error("Token does not grant access to this account");
    } catch {
      return NextResponse.json({ error: "Instagram could not verify this token/account. Generate a token using API setup with Instagram login and check the account ID." }, { status: 400 });
    }
    const verifiedAccount = {
      igUserId: discovered.id,
      igUsername: discovered.username,
      igName: discovered.name || discovered.username,
      profilePictureUrl: discovered.profile_picture_url,
      scopes: process.env.META_LOGIN_PROVIDER === "facebook"
        ? "instagram_basic,instagram_manage_comments,instagram_manage_messages"
        : "instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages",
    };

    // Encrypt token using AES-256-GCM before database persistence
    const encrypted = encryptToken(cleanToken);

    // Upsert connected account record
    const account = await prisma.connectedAccount.upsert({
      where: {
        workspaceId_igUserId: {
          workspaceId: user.workspaceId,
          igUserId: verifiedAccount.igUserId,
        },
      },
      update: {
        igUsername: verifiedAccount.igUsername,
        igName: verifiedAccount.igName,
        profilePictureUrl: verifiedAccount.profilePictureUrl,
        encryptedAccessToken: encrypted.encryptedAccessToken,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        scopes: verifiedAccount.scopes,
        isActive: true,
        healthStatus: "HEALTHY",
        isDeveloperToken: Boolean(isDeveloperToken),
        updatedAt: new Date(),
      },
      create: {
        workspaceId: user.workspaceId,
        igUserId: verifiedAccount.igUserId,
        igUsername: verifiedAccount.igUsername,
        igName: verifiedAccount.igName,
        profilePictureUrl: verifiedAccount.profilePictureUrl,
        encryptedAccessToken: encrypted.encryptedAccessToken,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        scopes: verifiedAccount.scopes,
        isActive: true,
        healthStatus: "HEALTHY",
        isDeveloperToken: Boolean(isDeveloperToken),
      },
    });

    await prisma.connectedAccount.updateMany({
      where: { workspaceId: user.workspaceId, id: { not: account.id } },
      data: { isActive: false },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        action: "ACCOUNT_CONNECTED",
        targetType: "ACCOUNT",
        targetId: account.id,
        metadata: JSON.stringify({
          igUsername: account.igUsername,
          isDeveloperToken: account.isDeveloperToken,
        }),
      },
    });

    // Sanitized response: NEVER return raw token or encryption secrets
    return NextResponse.json({
      success: true,
      account: {
        id: account.id,
        igUserId: account.igUserId,
        igUsername: account.igUsername,
        igName: account.igName,
        profilePictureUrl: account.profilePictureUrl,
        healthStatus: account.healthStatus,
        isDeveloperToken: account.isDeveloperToken,
        maskedToken: maskToken(cleanToken),
        scopes: account.scopes.split(","),
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    console.error("Connect Instagram failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json(
      { error: "Failed to connect Instagram account" },
      { status: 500 }
    );
  }
}
