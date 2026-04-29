# WineRadar

A lightweight web application for wine account managers. It generates and emails a weekly wine-market TL;DR for the brands you manage.

## Tech stack

- **Next.js 14** (App Router + TypeScript)
- **Supabase** — Auth + Postgres + Row Level Security
- **Exa** — News search
- **OpenAI** — Summarisation (gpt-4.1-mini, configurable via `OPENAI_MODEL`)
- **Nodemailer + Gmail SMTP** — Email delivery
- **Tailwind CSS** — Styling
- **Vercel** — Deployment

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | OpenAI API key (server-only) |
| `OPENAI_MODEL` | Model to use, e.g. `gpt-4.1-mini` |
| `OPENAI_MONTHLY_REQUEST_CAP` | Max OpenAI calls per user per month (default 100) |
| `OPENAI_REQUESTS_PER_BRIEFING_MAX` | Max OpenAI calls per briefing run (default 5) |
| `OPENAI_MAX_OUTPUT_TOKENS` | Max tokens per completion (default 700) |
| `EXA_API_KEY` | Exa API key (server-only) |
| `EXA_MONTHLY_REQUEST_CAP` | Max Exa searches per user per month (default 800) |
| `EXA_REQUESTS_PER_BRIEFING_MAX` | Max Exa searches per briefing run (default 5) |
| `SMTP_HOST` | SMTP host (smtp.gmail.com) |
| `SMTP_PORT` | SMTP port (465) |
| `SMTP_SECURE` | true |
| `SMTP_USER` | Gmail address |
| `SMTP_APP_PASSWORD` | Gmail App Password (16 chars) |
| `SMTP_FROM_EMAIL` | From label, e.g. `WineRadar <you@gmail.com>` |
| `CRON_SECRET` | Random secret for cron endpoint |
| `APP_URL` | Local: `http://localhost:3000` |
| `MAX_BRANDS_PER_USER` | Max brands a user can add (default 5) |
| `MAX_TOPICS_PER_USER` | Max topics a user can add (default 5) |
| `NEXT_PUBLIC_MAX_BRANDS` | Same value, exposed to browser for UI display |
| `NEXT_PUBLIC_MAX_TOPICS` | Same value, exposed to browser for UI display |

### 3. Supabase SQL setup

**First install (new project):**

1. Open your [Supabase project](https://app.supabase.com) → **SQL Editor**
2. Paste and run `supabase/setup.sql`

This creates all tables, RLS policies, and the trigger that seeds default topics + profile on sign-up.

**Existing install — apply migration:**

Run `supabase/migration_002_api_usage_columns.sql` in SQL Editor. This adds three nullable columns to `api_usage` (`metadata`, `briefing_id`, `briefing_job_id`). Safe to run on live data.

#### Disable email confirmation for local testing

In Supabase dashboard → **Authentication → Providers → Email**, disable "Confirm email" for easier local development.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing the app

### Test login / sign-up

1. Visit `/login`
2. Click **Create account**, enter email + password, submit
3. If email confirmation is disabled: sign in immediately
4. If email confirmation is enabled: confirm via email, then sign in
5. You should land on `/dashboard`
6. Check Supabase → Table Editor → `profiles` and `topics` to confirm the seed trigger ran

### Test brands

1. Go to `/brands`
2. Add up to 5 brands (e.g. "Château Margaux", "Penfolds", "Domaine Leflaive")
3. Verify the button is disabled at 5 and the form shows "You can add at most 5 brands"

### Test topics

1. Go to `/topics`
2. Four default topics should be pre-seeded
3. Edit, delete, or add (up to 5 total)

### Test settings

1. Go to `/settings`
2. Enter a recipient email
3. Choose send day and enable/disable weekly emails
4. Save

### Test manual briefing generation

1. Go to `/dashboard`
2. Click **Generate test briefing**
3. Wait ~20–40 seconds (Exa + OpenAI calls)
4. You should be redirected to the new briefing detail page
5. Check `/briefings` for the entry
6. If a recipient email is configured, check your inbox

### Test the daily manual briefing limit

1. Generate a test briefing (step above)
2. Return to `/dashboard`
3. The "Manual briefing today" row in the usage panel should show **"Already used today"**
4. The Generate button should be disabled
5. Call the API directly to confirm the 429:

```bash
curl -X POST http://localhost:3000/api/briefings/generate-test \
  -H "Cookie: <your-session-cookie>"
# Expected: {"error":"You have already generated a test briefing today...","dailyLimitReached":true}
```

6. To reset for testing, delete today's row from Supabase → Table Editor → `briefings`

### Test usage tracking

After generating a briefing, check Supabase → Table Editor → `api_usage`:

- Expect rows with `provider = "exa"`, `request_type = "search"` (one per brand)
- Expect rows with `provider = "openai"`, `request_type = "summarization"` (one per brand)
- Expect a row with `provider = "smtp"`, `request_type = "email_send"` (if email was sent)
- All rows should have `briefing_job_id` set to the job UUID

The dashboard usage panel shows live totals for the current month.

### Test cron idempotency

```bash
# First call — processes all eligible users
curl -X POST http://localhost:3000/api/cron/weekly-briefing \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# → {"success":true,"processed":1,"errors":[]}

# Second call same week — skipped (idempotent)
curl -X POST http://localhost:3000/api/cron/weekly-briefing \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# → {"success":true,"processed":0,"errors":[]}
```

Check Supabase → `briefing_jobs` to confirm only one row exists with `scheduled_for = <this Monday>` and `status = "done"`.

### Test cron endpoint manually (basic)

```bash
curl -X POST http://localhost:3000/api/cron/weekly-briefing \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

Expected: `{"success":true,"processed":N,"errors":[]}`

### Test cap fallback

To verify OpenAI/Exa fallback without hitting the real cap:

1. In Supabase → `api_usage`, insert a row: `provider=openai`, `request_type=summarization`, `request_count=100`, `period_month=YYYY-MM` (current month), `user_id=your-uuid`
2. Generate a test briefing
3. Briefing items should show the fallback message instead of an AI summary
4. Remove the test row to restore normal behaviour

---

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create wine-radar --private --push --source .
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the repository
3. Add all environment variables from `.env.local`
4. Set `APP_URL` to your Vercel production URL

### 3. Cron job

The `vercel.json` already configures a weekly cron at Monday 08:00 UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-briefing",
      "schedule": "0 8 * * 1"
    }
  ]
}
```

Vercel will call the endpoint with the `Authorization: Bearer` header set to `CRON_SECRET` automatically (set in the environment).

---

## Architecture

```
src/
├── app/
│   ├── (pages)          login / dashboard / brands / topics / settings / briefings
│   └── api/
│       ├── auth/callback          Supabase OAuth/email-confirm exchange
│       ├── briefings/generate-test  Manual briefing trigger (authenticated)
│       └── cron/weekly-briefing     Weekly automation (CRON_SECRET protected)
├── components/
│   └── layout/AppLayout.tsx       Sidebar navigation shell
├── lib/
│   ├── supabase/
│   │   ├── client.ts              Browser Supabase client (anon key)
│   │   ├── server.ts              Server Supabase client (anon key + cookies)
│   │   └── service.ts             Service-role client (bypasses RLS)
│   ├── services/
│   │   ├── briefing.ts            Orchestration: Exa → OpenAI → DB → email
│   │   ├── usage.ts               Usage tracking, cap checks, daily limit
│   │   ├── exa.ts                 Exa news search
│   │   ├── openai.ts              OpenAI summarisation (env-var model)
│   │   └── email.ts               Nodemailer/Gmail SMTP email
│   └── types.ts                   Shared TypeScript types
└── middleware.ts                   Auth guard + session refresh
```

### Security

- `NEXT_PUBLIC_*` variables only: `SUPABASE_URL` and `SUPABASE_ANON_KEY` — safe for browser
- All other keys (`SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `EXA_API_KEY`, `SMTP_*`, `CRON_SECRET`) are server-side only
- RLS enabled on every user-owned table — users cannot read/modify each other's data
- Service-role client used only in server-side API routes

---

## Smoke-test checklist

- [ ] Sign up → profile and 4 default topics created automatically
- [ ] Can add up to 5 brands; blocked at 6th
- [ ] Can add up to 5 topics; blocked at 6th
- [ ] Settings save and reload correctly
- [ ] "Generate test briefing" produces a briefing with content
- [ ] Briefing detail shows brand sections with key developments
- [ ] Email received (if SMTP configured and recipient email set)
- [ ] Generating a second test briefing on the same day is blocked (429)
- [ ] Dashboard usage panel shows Exa, OpenAI, and email counts
- [ ] `api_usage` table has rows after briefing generation
- [ ] Cron endpoint returns `success: true` and is blocked without secret
- [ ] Cron is idempotent — second call same week returns `processed: 0`
- [ ] Another user cannot see your briefings (RLS)
