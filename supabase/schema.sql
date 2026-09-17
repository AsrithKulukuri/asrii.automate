-- Asrii Automate: Supabase PostgreSQL Schema with Row Level Security (RLS)
-- Optimized for production deployment on Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER', -- OWNER, ADMIN, MEMBER
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, user_id)
);

-- Connected Accounts (Encrypted Meta Instagram Credentials)
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  ig_username TEXT NOT NULL,
  ig_name TEXT,
  profile_picture_url TEXT,
  encrypted_access_token TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT NOT NULL DEFAULT 'instagram_basic,instagram_manage_comments,instagram_manage_messages',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  health_status TEXT NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, WARNING, EXPIRED, REVOKED
  is_developer_token BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, ig_user_id)
);

-- Workflows Table
CREATE TABLE IF NOT EXISTS public.workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  connected_account_id UUID REFERENCES public.connected_accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  trigger_config JSONB NOT NULL DEFAULT '{}',
  condition_config JSONB NOT NULL DEFAULT '{}',
  action_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow Executions
CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  trigger_event_id TEXT,
  status TEXT NOT NULL, -- SUCCESS, FAILED, SKIPPED, UNSUPPORTED
  mode TEXT NOT NULL, -- MOCK, LIVE
  input_payload JSONB NOT NULL,
  execution_logs JSONB NOT NULL DEFAULT '[]',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Webhook Events (Deduplication & Audit)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_id TEXT UNIQUE NOT NULL,
  object_type TEXT NOT NULL DEFAULT 'instagram',
  raw_payload JSONB NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'PROCESSED', -- PROCESSED, DUPLICATE, FAILED, IGNORED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ig_scoped_id TEXT NOT NULL,
  username TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, ig_scoped_id)
);

-- Message Logs
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
  recipient_id TEXT NOT NULL,
  comment_id TEXT,
  message_type TEXT NOT NULL DEFAULT 'PRIVATE_REPLY', -- PRIVATE_REPLY, DIRECT_MESSAGE
  message_content TEXT NOT NULL,
  meta_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'SENT', -- SENT, FAILED, RATE_LIMITED, UNSUPPORTED
  error_details JSONB,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes for High Performance & Production Workloads
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_connected_accounts_workspace ON public.connected_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_ig_user_id ON public.connected_accounts(ig_user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_workspace ON public.workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON public.workflows(workspace_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON public.workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_workspace_event ON public.webhook_events(workspace_id, event_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_workspace ON public.message_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_comment_status ON public.message_logs(comment_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);

-- ============================================================================
-- Automatic updated_at Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_connected_accounts_updated_at ON public.connected_accounts;
CREATE TRIGGER trg_connected_accounts_updated_at
  BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_workflows_updated_at ON public.workflows;
CREATE TRIGGER trg_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- Row Level Security (RLS) Helper Functions & Policies
-- ============================================================================

-- Helper function to check if the current user belongs to a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_members.workspace_id = is_workspace_member.workspace_id
      AND workspace_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if the current user is an owner or admin of a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_admin(workspace_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_members.workspace_id = is_workspace_admin.workspace_id
      AND workspace_members.user_id = auth.uid()
      AND workspace_members.role IN ('OWNER', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS across all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 2. Workspaces policies
CREATE POLICY "Members can view their workspaces"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id) OR owner_id = auth.uid());

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (owner_id = auth.uid() OR public.is_workspace_admin(id));

CREATE POLICY "Owners can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- 3. Workspace Members policies
CREATE POLICY "Members can view workspace membership"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage workspace members"
  ON public.workspace_members FOR ALL
  USING (public.is_workspace_admin(workspace_id));

-- 4. Connected Accounts policies
CREATE POLICY "Members can view connected accounts"
  ON public.connected_accounts FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage connected accounts"
  ON public.connected_accounts FOR ALL
  USING (public.is_workspace_admin(workspace_id));

-- 5. Workflows policies
CREATE POLICY "Members can view workflows"
  ON public.workflows FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage workflows"
  ON public.workflows FOR ALL
  USING (public.is_workspace_admin(workspace_id));

-- 6. Workflow Executions policies
CREATE POLICY "Members can view workflow executions"
  ON public.workflow_executions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workflows
    WHERE workflows.id = workflow_executions.workflow_id
      AND public.is_workspace_member(workflows.workspace_id)
  ));

-- 7. Webhook Events policies
CREATE POLICY "Members can view webhook events"
  ON public.webhook_events FOR SELECT
  USING (public.is_workspace_member(workspace_id));

-- 8. Contacts policies
CREATE POLICY "Members can view and manage contacts"
  ON public.contacts FOR ALL
  USING (public.is_workspace_member(workspace_id));

-- 9. Message Logs policies
CREATE POLICY "Members can view message logs"
  ON public.message_logs FOR SELECT
  USING (public.is_workspace_member(workspace_id));

-- 10. Audit Logs policies
CREATE POLICY "Members can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_workspace_member(workspace_id));

-- Service role bypass: Supabase server operations (via service_role key) bypass RLS automatically.
