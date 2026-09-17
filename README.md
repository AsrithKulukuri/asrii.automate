# Asrii Automate — local testing

Instagram comment automation with a SQLite database and a mock execution playground.

## Start

1. Install dependencies: `npm install`.
2. Copy `.env.example` to `.env` if no local environment file exists.
3. Run `npm run setup:local` to generate Prisma, create the SQLite tables, and seed two sample workflows.
4. Run `npm run dev` and open http://localhost:3000.
5. Enter the demo workspace and open **Playground**. Select **Price Inquiry Auto-Reply**, enter “What is the price?”, and run a mock test.

Mock runs persist in Activity. Try unrelated text and excluded keywords to verify skipped executions. Create, edit, pause, and delete workflows from Workflows.

Real message dispatch is disabled by default. Keep `ENABLE_LIVE_META=false` for testing. Webhook events execute in mock mode unless this flag is explicitly enabled. Meta OAuth and real account connections require actual Meta credentials; the seeded account is simulated.

## Checks

- `npm test`: automated tests (currently use the configured local database).
- `npm run lint`: lint checks.
- `npm run build`: compilation and TypeScript checks.
- `GET /api/health`: database and configuration status.

This demo uses simplified authentication and is intended for local testing. Do not expose it publicly as a production service.
