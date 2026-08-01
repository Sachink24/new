# Solitaire Finz Mart — DSA Loan Management Platform

A database-backed Loan DSA / Loan Origination & Distribution Management System
covering the full lifecycle: **Lead → Customer → Documents → Eligibility →
Application/Login → Credit → Legal/Technical → Sanction → Disbursement →
Payout/Commission → Closure.**

Built with Next.js 14 (App Router, TypeScript), PostgreSQL + Prisma, and
NextAuth credentials-based authentication with server-side RBAC.

---

## What's implemented

- **Auth & RBAC** — 13 roles (Super Admin down to Management Viewer), a
  server-side permission matrix (`src/lib/rbac.ts`) enforced on every API
  route — not just hidden in the UI.
- **Leads** — full CRM: capture, assignment, multi-entry follow-up history,
  status pipeline.
- **Customers** — 360° profile, co-applicants, entity types.
- **Products & Lenders** — fully admin-configurable masters. Lender credit
  policy (ticket size, CIBIL cutoff, FOIR cap, rates, TAT) lives in the
  database, not in code, and can be edited any time.
- **Lender matching engine** (`src/lib/eligibility.ts`) — compares an
  application against every lender configured for its product and returns
  Recommended / Possible / Not Eligible with the specific rules that failed.
- **Applications** — a 360° workspace with tabs (Overview, Applicant,
  Documents, Credit, Legal, Technical, Sanction, Disbursement, Payout,
  Queries, Notes, Timeline, Audit History) and a visual workflow progress
  bar with stage-advance and override actions.
- **Configurable workflow engine** (`src/lib/workflow.ts`) — stage order is
  a data structure, not a hard-coded switch; unsecured products
  automatically skip Legal/Technical.
- **Documents** — metadata + status workflow (Pending → Verified/Rejected/
  Reupload Required). Wire `storageKey` to your object storage (S3 / R2 /
  GCS) behind signed URLs — see the note in `src/app/api/documents/route.ts`.
- **Credit / Legal / Technical evaluations**, **Sanctions**, **Disbursements**
  (multi-tranche), **Payouts** — disbursement + payout creation is wrapped
  in a single DB transaction so a disbursement is never left "successful"
  with no traceable payout behind it, and a unique constraint prevents
  duplicate payouts per disbursement.
- **Audit log** — every sensitive mutation writes an immutable row
  (`src/lib/audit.ts`) with previous/new value, user, and timestamp.
- **Dashboard** — real aggregate metrics computed from the database
  (login/sanction/disbursement amounts, conversion rate, stage funnel,
  lender-wise disbursement).
- **Reports** — filterable by date range, CSV export.
- **Light/dark mode** with the Solitaire black-and-gold identity.

## What's intentionally scaffolded, not fully built

This is a genuinely large spec (33 sections). The foundation above is real
and production-shaped, but the following are extension points rather than
finished features — each is a reasonably contained addition on top of what
exists:

- **Legal/Technical department dashboards** — the data model and evaluation
  APIs exist; dedicated queue UIs (like the Documents page) are not yet built.
- **Notifications delivery** — the `Notification` model exists; wiring it to
  email/SMS/WhatsApp providers is not done.
- **Global search** — not implemented; add a `/api/search` route that queries
  across Lead/Customer/Application by the indexed fields.
- **File upload UI** — the Documents API expects a `storageKey`; you'll need
  to add an object-storage upload flow (signed URL) in front of it.
- **MFA** — NextAuth is configured for credentials login; add an MFA provider
  for privileged roles before production use with real customer data.
- **Automated tests** — none included yet; `src/lib/workflow.ts`,
  `src/lib/eligibility.ts`, and the disbursement/payout transaction are the
  highest-value places to start.

---

## Local development

### 1. Prerequisites
- Node.js 18+
- A PostgreSQL database (local, or a free hosted one — see Deployment below)

### 2. Install
```bash
cd solitaire-finz-mart
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# edit .env: set DATABASE_URL and a random NEXTAUTH_SECRET
```
Generate a secret quickly with:
```bash
openssl rand -base64 32
```

### 4. Set up the database
```bash
npx prisma migrate dev --name init
npm run seed
```
This creates all tables and seeds demo data, including a login:
```
admin@solitairefinzmart.com / Admin@12345
```
Other demo users (all same password): `priya.sales@…` (Sales RM),
`ravi.ops@…` (Operations), `anjali.credit@…` (Credit Manager),
`faisal.accounts@…` (Accounts).

**Change these passwords or delete the demo users before going live.**

### 5. Run
```bash
npm run dev
```
Visit http://localhost:3000 — you'll be redirected to `/login`.

---

## Deployment

### Recommended: Vercel + Neon/Supabase Postgres

1. **Database** — create a free Postgres instance on
   [Neon](https://neon.tech), [Supabase](https://supabase.com), or
   [Railway](https://railway.app). Copy the connection string.
2. **Push to GitHub** — `git init && git add -A && git commit -m "Initial commit"`,
   then push to a new repo.
3. **Import into Vercel** — vercel.com → New Project → import the repo.
4. **Environment variables** in Vercel project settings:
   - `DATABASE_URL` — your hosted Postgres string
   - `NEXTAUTH_SECRET` — a random string (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your production URL, e.g. `https://solitairefinzmart.vercel.app`
5. **Build command** is already set in `package.json`
   (`prisma generate && next build`), so Vercel will generate the Prisma
   client automatically on every deploy.
6. **Run migrations against production** once, from your machine:
   ```bash
   DATABASE_URL="<your prod url>" npx prisma migrate deploy
   DATABASE_URL="<your prod url>" npm run seed   # optional — demo data
   ```
7. Deploy. First deploy will build and go live.

### Alternative: any Node host (Render, Railway, a VPS)
- `npm run build` then `npm run start` (serves on port 3000 by default,
  override with `PORT`).
- Make sure `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` are set in
  the host's environment settings.
- Run `npx prisma migrate deploy` once against the production database
  before first start.

---

## Project structure

```
prisma/
  schema.prisma        All database models (RBAC, leads, customers,
                        applications, documents, credit/legal/technical,
                        sanctions, disbursements, payouts, audit log)
  seed.ts               Demo data generator

src/
  app/
    login/               Login page
    (dashboard)/         Authenticated app shell (sidebar + all modules)
      dashboard/
      leads/  leads/[id]/
      customers/
      applications/  applications/[id]/     <- the 360° workspace
      documents/  credit/  sanctions/  disbursements/  payouts/
      lenders/  products/  users/  reports/  audit-logs/
    api/                 All backend routes — RBAC-enforced, audit-logged
  lib/
    prisma.ts            Prisma client singleton
    auth.ts               NextAuth config + getCurrentUser()
    rbac.ts               Permission matrix + requirePermission()
    audit.ts               writeAuditLog()
    workflow.ts            Stage-transition engine
    eligibility.ts         Lender matching engine
    ids.ts                  Human-readable ID generators (LEAD-2026-000001, etc.)
    format.ts               INR currency / date formatting
  components/            Sidebar, DataTable, KpiCard, StatusChip, ThemeToggle
```

## Extending the system

- **New loan product**: add a row via the Products page — no code change
  needed. Attach lenders to it via the Lenders page.
- **New role**: add to the `Role` enum in `schema.prisma`, run a migration,
  then add its permissions to the `MATRIX` in `src/lib/rbac.ts`.
- **New workflow stage**: add to `ApplicationStage` enum and to
  `DEFAULT_STAGE_ORDER` in `src/lib/workflow.ts`.
- **Real document storage**: replace the `storageKey` placeholder with a
  signed-URL upload flow against S3/R2/GCS; never serve documents from a
  public bucket path.
