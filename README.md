# Job Assist

A private, single-user job-search command center: import StillHiring companies, add the
jobs you actually apply to, and track every application stage through to offer / rejection.

- **One user, one workspace.** No signup, no teams, no billing - login is an admin email +
  password held in server-only environment variables.
- **StillHiring is a snapshot, not a dependency.** A local CLI captures the public Airtable
  shared view and upserts companies into Postgres. The deployed app never talks to Airtable
  and never needs Chromium at runtime.
- **Your tracking data is sacred.** A re-sync only ever rewrites StillHiring-owned company
  fields; notes, favourites, ignored flags, jobs, applications, events, recruiter and
  follow-up data are never touched (covered by tests).

Stack: Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn-style UI components ·
Prisma · PostgreSQL (Neon) · Zod · Vercel. Playwright is used **only** by the CLI
import script.

---

## 1. Screens

| Route                      | What it does                                                                     |
| -------------------------- | -------------------------------------------------------------------------------- |
| `/login`                   | Email + password, sets a signed HTTP-only session cookie.                        |
| `/app`                     | Dashboard: pipeline stats, needs attention (follow-ups/interviews), recent activity. |
| `/app/companies`           | Dense filterable table over 1000+ companies (server-side filters + pagination).   |
| `/app/companies/[id]`      | Hiring / growth / funding signals, notes, jobs and applications for one company.  |
| `/app/companies/new`       | Manually add a company (works exactly like an imported one).                      |
| `/app/jobs/new`            | Fast "add job" with a company combobox (+ optional "mark as applied").            |
| `/app/jobs/[id]`           | Job detail, start/continue an application.                                        |
| `/app/applications`        | Table **and** Kanban pipeline view (view choice remembered).                      |
| `/app/applications/[id]`   | The interview-time screen: status, summary, timeline, follow-ups, interviews.     |
| `/app/import`              | StillHiring import status + the CLI command to run.                               |
| `/app/settings`            | Admin email, database status, import stats, version.                              |

`Cmd/Ctrl + K` opens global search across companies, jobs, applications and notes.

---

## 2. Local setup

```bash
git clone <your-repo> job-assist
cd job-assist
npm install

cp .env.example .env.local      # then fill it in (see below)

npm run db:migrate              # create the schema
npm run db:seed                 # optional: 10 fictional companies + jobs + applications
npm run dev                     # http://localhost:3000
```

Anything below `prisma/` except `schema.prisma` and `migrations/` is dev-only; the seed uses
fictional companies on purpose.

### Environment variables (`.env.local`)

```env
DATABASE_URL=          # pooled Postgres connection (app runtime)
DIRECT_URL=            # direct Postgres connection (migrations)
ADMIN_EMAIL=           # the only account allowed to log in
ADMIN_PASSWORD=        # password for that account (read server-side only)
AUTH_SECRET=           # random 32+ char string used to sign the session cookie
```

Optional:

```env
SHADOW_DATABASE_URL=            # only if `prisma migrate dev` needs a shadow database
STILL_HIRING_URL=              # override the public share URL if StillHiring moves it
STILL_HIRING_CAPTURE_TIMEOUT_MS # default 45000
STILL_HIRING_INSECURE_TLS=1     # only if a TLS-inspecting proxy breaks the capture
```

---

## 3. Authentication

Single-user by design - there is no signup, no password reset and no user table.

```env
ADMIN_EMAIL=me@example.com
ADMIN_PASSWORD=choose-a-long-private-password
AUTH_SECRET=...
```

Generate the secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` are read **server-side only**, inside the login server
  action - they are never bundled into client JavaScript and never rendered into the page.
- On Vercel, store `ADMIN_PASSWORD` as a **Sensitive Environment Variable** (Project → Settings →
  Environment Variables, then mark it sensitive) so it cannot be read back from the dashboard or
  written into build logs.
- The password is compared with Node's `crypto.timingSafeEqual` instead of `===`, so a wrong guess
  cannot be narrowed down through response timing. The email is compared case-insensitively.
- Changing the password means editing the environment variable and redeploying: no hash to
  generate, nothing in the database to update.

How it works: login compares the submitted email with `ADMIN_EMAIL`, compares the password with
`ADMIN_PASSWORD`, then sets `job_assist_session` - an HMAC-SHA256 signed, HTTP-only, `SameSite=Lax`
cookie (secure in production, 30-day expiry). Every `/app/*` route is blocked by middleware
(`proxy.ts`) and every server action re-checks the session before writing.

---

## 4. Neon + Prisma

1. Create a project at [neon.tech](https://neon.tech) (Postgres 16).
2. Open **Connection Details** and copy both strings:
   - **Pooled** (`...-pooler.region.aws.neon.tech/...`, add `?sslmode=require`) → `DATABASE_URL`.
   - **Direct** (no `-pooler`, add `?sslmode=require`) → `DIRECT_URL`.
3. Locally they both point at whatever Postgres you run; in production the split matters because
   Prisma Migrate cannot run through a connection pooler.

```bash
npm run db:migrate     # local dev: creates + applies a migration
npm run db:deploy      # staging/production: applies existing migrations only
```

Migrations live in `prisma/migrations/` and are committed.

---

## 5. StillHiring import

StillHiring publishes its company list as a **public Airtable shared view**. The importer opens
that public page in a headless browser, captures the same `readSharedViewData` response the page
itself receives, decodes it (MessagePack, with JSON fallback), normalizes every row and upserts
companies into your database.

```bash
npx playwright install chromium   # once
npm run stillhiring:sync
```

Expected output:

```text
StillHiring sync
Loading public Airtable view...
Captured readSharedViewData from https://airtable.com/v0.3/view/.../readSharedViewData
Shared view response captured.

Rows received: 1129

Normalizing...
1129 valid companies
0 invalid companies

Database:
1021 created
108 updated
0 failed

Sync complete.
```

Notes:

- **No credentials.** No Airtable account, API key, or private table access - the script reads
  only the data the public page already loads. The signed `accessPolicy` in the request URL is
  obtained fresh on every run and is never hardcoded.
- **Idempotent.** Companies are matched on `source = STILL_HIRING` + `sourceId` (Airtable record
  id). Running it twice updates instead of duplicating.
- **Preserving.** A sync may only write StillHiring-owned fields (`name`, `jobsUrl`, `employees`,
  location, `tagline`, `remoteHiring`, hiring/growth/funding signals, import timestamp). Notes,
  favourites, ignored flags, jobs, applications, timeline events, recruiter, interview and
  follow-up data are never modified - enforced in `lib/still-hiring/import.ts`
  (`STILL_HIRING_OWNED_FIELDS`) and covered by tests.
- **Normalized.** Airtable select ids become readable names
  (`selr7HWN7IyhlVNs5` → `Hiring Software Engineering`); `Remote Hiring?` becomes
  `YES / NO / NOT_SURE / UNKNOWN`; button fields yield their URL; ranges such as `51-200` are
  parsed into a numeric `employees` plus the original text.
- **Column mapping is by name first.** `data.table.columns` is read at runtime to build a
  column-id → column-name map, with the known field ids as a fallback, so renamed fields keep
  working.
- **Failure messages** cover: shared view not loading, no `readSharedViewData` response, invalid
  JSON/MessagePack, unexpected table structure, and database connection problems.

Syncing happens locally (also fine against your Neon production database - it is the same script
with a different `DATABASE_URL`). The deployed app deliberately does not bundle Chromium, so
`/app/import` shows the import status and the command instead of a "Sync now" button.

---

## 6. Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel: **New Project → import the repo** (framework preset: Next.js; build command and
   output are detected; `postinstall` runs `prisma generate`).
3. Add environment variables for **Production** (and Preview if you want):
   `DATABASE_URL`, `DIRECT_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mark it **Sensitive**),
   `AUTH_SECRET`.
4. Apply migrations to Neon from your machine:

   ```bash
   DIRECT_URL="postgres://...direct..." DATABASE_URL="postgres://...pooled..." npm run db:deploy
   ```

5. Deploy, open `/login`, sign in with `ADMIN_EMAIL` + your password.
6. Import the company list against production:

   ```bash
   DATABASE_URL="postgres://...pooled..." DIRECT_URL="postgres://...direct..." npm run stillhiring:sync
   ```

   (or temporarily point `.env.local` at Neon). Vercel's build does not need Playwright.

---

## 7. Scripts

| Script                      | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `npm run dev`               | Next.js dev server.                                            |
| `npm run build` / `start`   | Production build / server.                                     |
| `npm run lint`              | ESLint.                                                        |
| `npm run typecheck`         | `tsc --noEmit`.                                                |
| `npm run test`              | Vitest unit + database tests (`test:watch` for watch mode).     |
| `npm run test:e2e`          | Playwright auth flow (starts a dev server on port 3300).       |
| `npm run db:migrate`        | `prisma migrate dev` (local development).                      |
| `npm run db:deploy`         | `prisma migrate deploy` (existing migrations).                 |
| `npm run db:seed`           | Fictional dev data: 10 companies, 12 jobs, applications, events. |
| `npm run stillhiring:sync`  | Import/refresh StillHiring companies.                          |

### Tests

```bash
npm test          # normalization, import idempotency + preservation, decode, auth sessions
npm run test:e2e  # unauthenticated redirect, wrong password, successful session
```

The database tests run against `TEST_DATABASE_URL` when set; otherwise the suite derives
`job_assist_test` from `DATABASE_URL` and applies migrations to it first. The e2e suite signs in
with `ADMIN_EMAIL` + `ADMIN_PASSWORD`, so run it with those exported (or let the defaults in
`tests/e2e/auth.spec.ts` match your `.env.local`).

---

## 8. Project structure

```text
app/
  login/                 # single sign-in page
  app/                   # protected workspace (dashboard, companies, jobs, applications, import, settings)
components/
  app-shell/             # sidebar, top bar, command menu, theme toggle
  companies/ jobs/ applications/ ui/
lib/
  auth/                  # session cookie + server-action guard
  db/                    # prisma client + queries
  services/              # company / job / application write logic (shared by actions and CLI)
  still-hiring/          # types, decode, normalize, import (used by the CLI sync)
  validation/            # zod schemas
prisma/                  # schema, migrations, seed
scripts/                 # sync-still-hiring, capture-shared-view
tests/                   # vitest specs + fixtures, tests/e2e (Playwright)
```

Dates are stored in UTC and displayed in `Europe/Istanbul` (`lib/format.ts`).
Status changes always write an `ApplicationEvent`, so every application keeps a timeline.

---

## 9. Troubleshooting

**`TLS certificate error` / `SELF_SIGNED_CERT_IN_CHAIN` during sync.** A TLS-inspecting proxy
(corporate antivirus, VPN) is intercepting traffic:

```bash
STILL_HIRING_INSECURE_TLS=1 npm run stillhiring:sync
```

**`Could not find a readSharedViewData response`.** The public share may have moved. Open the
StillHiring company list in your browser, copy the Airtable URL and run:

```bash
STILL_HIRING_URL="https://airtable.com/embed/<new-share-url>" npm run stillhiring:sync
```

**Nothing imports / `DATABASE_URL is not set`.** Copy `.env.example` to `.env.local` and run
`npm run db:migrate` first; the sync verifies the connection before touching the dataset.

**`Login is not configured`, or locked out.** `ADMIN_EMAIL` and/or `ADMIN_PASSWORD` is unset or
empty. Set both (in `.env.local`, or in the Vercel project settings) and restart / redeploy -
there is no hash to regenerate and no database change involved.

**`MaxListenersExceededWarning: ... 11 drain listeners added to [Gzip]`.** Harmless, and not from
this app's code: Next.js 16.3+ leaks one `drain` listener per backpressured write while streaming
App Router responses through gzip (vercel/next.js#97698 fixes it; discussion #95130 confirms no
action is needed on our side). Responses stay complete and correct - it only adds log noise, most
visibly when a slow client streams a large page. Leave it alone, or silence it with
`compress: false` in `next.config.ts` if the logs bother you.
