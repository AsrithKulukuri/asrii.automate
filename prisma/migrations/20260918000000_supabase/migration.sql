-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "asrii";

-- CreateTable
CREATE TABLE "asrii"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."connected_accounts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "igUserId" TEXT NOT NULL,
    "igUsername" TEXT NOT NULL,
    "igName" TEXT,
    "profilePictureUrl" TEXT,
    "encryptedAccessToken" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3),
    "scopes" TEXT NOT NULL DEFAULT 'instagram_basic,instagram_manage_comments,instagram_manage_messages',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "healthStatus" TEXT NOT NULL DEFAULT 'HEALTHY',
    "isDeveloperToken" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."workflows" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "connectedAccountId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerConfig" TEXT NOT NULL DEFAULT '{}',
    "conditionConfig" TEXT NOT NULL DEFAULT '{}',
    "actionConfig" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."workflow_executions" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "triggerEventId" TEXT,
    "status" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "inputPayload" TEXT NOT NULL,
    "executionLogs" TEXT NOT NULL,
    "durationMs" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."webhook_events" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL DEFAULT 'instagram',
    "rawPayload" TEXT NOT NULL,
    "signature" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."contacts" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "igScopedId" TEXT NOT NULL,
    "username" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "lastInteractionAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."message_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "workflowExecutionId" TEXT,
    "recipientId" TEXT NOT NULL,
    "commentId" TEXT,
    "messageType" TEXT NOT NULL DEFAULT 'PRIVATE_REPLY',
    "messageContent" TEXT NOT NULL,
    "metaMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "errorDetails" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asrii"."audit_logs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "asrii"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "asrii"."workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "asrii"."workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "connected_accounts_workspaceId_igUserId_key" ON "asrii"."connected_accounts"("workspaceId", "igUserId");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventId_key" ON "asrii"."webhook_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_workspaceId_igScopedId_key" ON "asrii"."contacts"("workspaceId", "igScopedId");

-- AddForeignKey
ALTER TABLE "asrii"."workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "asrii"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "asrii"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."connected_accounts" ADD CONSTRAINT "connected_accounts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "asrii"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."workflows" ADD CONSTRAINT "workflows_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "asrii"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."workflows" ADD CONSTRAINT "workflows_connectedAccountId_fkey" FOREIGN KEY ("connectedAccountId") REFERENCES "asrii"."connected_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."workflow_executions" ADD CONSTRAINT "workflow_executions_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "asrii"."workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."webhook_events" ADD CONSTRAINT "webhook_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "asrii"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."contacts" ADD CONSTRAINT "contacts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "asrii"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."message_logs" ADD CONSTRAINT "message_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "asrii"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."message_logs" ADD CONSTRAINT "message_logs_workflowExecutionId_fkey" FOREIGN KEY ("workflowExecutionId") REFERENCES "asrii"."workflow_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."audit_logs" ADD CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "asrii"."workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asrii"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "asrii"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
