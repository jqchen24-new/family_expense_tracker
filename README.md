# Family Expense Tracker

A web app to consolidate credit card and bank statements, connect accounts via Plaid, and visualize family spending.

## Stack

- **Next.js** (App Router), **TypeScript**, **Tailwind CSS**
- **Prisma** + **SQLite** (dev) / PostgreSQL (production)
- **NextAuth.js** (credentials)
- **Plaid** (US/Canada bank connection)
- **Recharts** (dashboard charts)

## Setup

1. **Install and DB**
   ```bash
   npm install
   cp .env.example .env
   npx prisma migrate dev
   npm run seed   # optional: demo user demo@example.com / demo1234
   ```

2. **Env**
   - `DATABASE_URL` – SQLite: `file:./dev.db` or PostgreSQL URL
   - `NEXTAUTH_URL` – e.g. `http://localhost:3000`
   - `NEXTAUTH_SECRET` – e.g. `openssl rand -base64 32`
   - For Plaid: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (sandbox / development / production) from [Plaid Dashboard](https://dashboard.plaid.com)

3. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — sign up or use the seeded demo user.

## Features

- **Auth**: Sign up / sign in (single user).
- **Dashboard**: This month vs last month; spending by category (bar + pie).
- **Transactions**: List with filters (date range, account, category).
- **Accounts**: Connect banks via Plaid; view upload and Plaid accounts.
- **Upload**: CSV statement upload (generic and Chase formats); deduplication by hash.
- **Plaid**: Link token → exchange → store access token; transactions sync (Transactions Sync API); webhook at `POST /api/plaid/webhook` for `DEFAULT_UPDATE`.

## CSV formats

- **Generic**: Columns for date, description, amount (and optional debit/credit, category).
- **Chase**: Posting date, description, amount, type, category.

Add more in `src/lib/csv-parser.ts` and the upload form.

## Plaid webhook

In Plaid Dashboard set webhook URL to `https://your-domain.com/api/plaid/webhook` and subscribe to Transactions `DEFAULT_UPDATE` (and optionally `INITIAL_UPDATE`).
