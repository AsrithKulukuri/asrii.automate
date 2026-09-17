# Current Supabase deployment

Use `prisma/schema.prisma` and `npm run db:deploy`. Current app tables are in the `asrii` schema. Do not run the legacy `supabase/schema.sql` for this Prisma app: its UUID IDs and snake_case columns are incompatible.

Set Vercel DATABASE_URL to the complete local Session pooler URL (including schema=asrii, sslmode=require and connection_limit=2), then deploy the updated code. Build command: `npm run build`. See README.md for the real Instagram test configuration.

---

## Historical deployment notes (superseded where conflicting)

# Production Deployment & Operations Guide

This guide details the steps to deploy **Asrii Automate** into production with Supabase PostgreSQL, official Meta Graph API v21.0 integration, and Vercel/Node hosting.

---

## 1. Architecture Overview

- **Frontend & API**: Next.js 16 (Turbopack, App Router, React 19)
- **Database**: PostgreSQL (Supabase with Row Level Security enabled) or SQLite for local dev
- **Encryption Vault**: AES-256-GCM authenticated encryption for access tokens
- **Official API**: Meta Graph API v21.0 (Instagram Messaging & Webhooks)

---

## 2. Environment Variables Checklist

Ensure these variables are set in your production host (e.g., Vercel, Railway, AWS ECS):

| Variable | Description | Example / Note |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public production URL of the app | `https://automate.asrii.com` |
| `DATABASE_URL` | Supabase / PostgreSQL connection string | `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true` |
| `TOKEN_ENCRYPTION_KEY` | 32-byte (64 hex characters) secret for AES-256-GCM vault | Generate with `openssl rand -hex 32` |
| `META_APP_ID` | Official Meta App ID | From Meta Developer Dashboard |
| `META_APP_SECRET` | Official Meta App Secret (for HMAC verification) | Keep secure; never expose to client |
| `META_VERIFY_TOKEN` | Custom string for Meta Webhook verification handshake | e.g. `asrii_prod_verify_secret_token_8892` |
| `META_API_VERSION` | Graph API version | `v21.0` |
| `NODE_ENV` | Environment indicator | `production` |

---

## 3. Database Migration (Supabase PostgreSQL)

1. Open your Supabase Dashboard: **SQL Editor**.
2. Copy the contents of `supabase/schema.sql`.
3. Execute the SQL script. This creates:
   - All 9 application tables (`users`, `workspaces`, `workspace_members`, `connected_accounts`, `workflows`, `workflow_executions`, `webhook_events`, `contacts`, `message_logs`, `audit_logs`).
   - Automated `updated_at` trigger functions.
   - Production performance indexes (`workflow_executions_status`, `created_at DESC`, `message_logs_comment_status`).
   - Comprehensive **Row Level Security (RLS)** policies ensuring strict multi-tenant workspace isolation.

---

## 4. Meta Developer Portal Configuration

### A. Meta App Setup
1. Create a **Business App** on [developers.facebook.com](https://developers.facebook.com/).
2. Add the **Instagram Graph API** product.
3. In App Review, request the following permissions:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_read_engagement`

### B. Webhooks Subscription
1. Under **Instagram > Webhooks**:
   - **Callback URL**: `https://your-domain.com/api/webhooks/instagram`
   - **Verify Token**: Enter the exact value configured in `META_VERIFY_TOKEN`.
2. Click **Verify and Save**. Meta will execute a `GET` handshake which Asrii Automate validates instantly.
3. Subscribe to the following webhook fields:
   - `comments`
   - `messages`

---

## 5. Security & Verification Features

- **HMAC-SHA256 Signatures**: Every incoming POST webhook from Meta is validated against `x-hub-signature-256` using constant-time `crypto.timingSafeEqual`.
- **Multi-Tenant Ingestion**: Webhooks resolve the tenant by matching `evt.accountId` to `connected_accounts.igUserId`.
- **Meta Policy Enforcement**:
  - **7-day window**: Private replies are rejected if the comment is older than 7 days.
  - **Single Reply Guarantee**: Deduplicated against `message_logs` to prevent duplicate private replies (Meta Error #10900).
  - **1,000-character safety**: Message templates exceeding 1,000 characters are safely formatted.
- **Monitoring Endpoint**: Uptime pingers can poll `GET /api/health` to verify database and encryption health.
