# AI Changelog Generator

Connect GitHub, pick a repo and a commit range, and generate a professional
changelog with AI. Export as Markdown, or copy formatted for Notion / Slack.

- **Frontend:** Next.js 16 (App Router) · TypeScript · Tailwind · NextAuth (GitHub OAuth)
- **Backend:** NestJS 11 · REST + SSE streaming · OpenAI (`gpt-4o-mini`)
- **DB:** Supabase (Postgres)

```
frontend/   Next.js app (UI + GitHub OAuth)
backend/    NestJS API (GitHub proxy, OpenAI, Supabase)
```

---

## 1. Prerequisites (you must create these — they need your accounts)

| What | Where | Notes |
|------|-------|-------|
| GitHub OAuth App | github.com → Settings → Developer settings → OAuth Apps | Callback URL: `http://localhost:3000/api/auth/callback/github` |
| OpenAI API key | platform.openai.com | Used by the backend |
| Supabase project | supabase.com | Run `backend/supabase-schema.sql` in the SQL editor |
| NextAuth secret | `openssl rand -base64 32` | For session signing |

## 2. Get the source and configure environment

Requires Git, Node.js 22 (run `nvm use`) and npm. Clone before running the commands below:

```bash
git clone https://github.com/Lenin-Miranda/AI-Changelog-Generator.git
cd AI-Changelog-Generator
```

There is no root npm workspace: install backend and frontend dependencies separately.


```bash
cp backend/.env.example backend/.env            # fill OPENAI_API_KEY, SUPABASE_*
cp frontend/.env.local.example frontend/.env.local  # fill GITHUB_*, NEXTAUTH_*
```

## 3. Run locally

```bash
# terminal 1 — backend on :3001
cd backend && npm ci && npm run start:dev

# terminal 2 — frontend on :3000
cd frontend && npm ci && npm run dev
```

Open http://localhost:3000 → **Connect GitHub** → pick a repo → load commits →
**Generate**.

---

## How it works

1. NextAuth runs GitHub OAuth (scopes `read:user repo`) and stores the access
   token + numeric GitHub id in the JWT session.
2. Every private request verifies the bearer token against GitHub `/user`; user IDs
   from the browser are never trusted. The frontend calls the NestJS backend with `Authorization: Bearer <token>`.
   The backend proxies the GitHub API for repos and commits (with rate-limit /
   private-repo error handling).
3. `POST /changelog/generate` builds the prompt, streams OpenAI tokens back as
   **Server-Sent Events**, and the frontend renders them live via a
   `ReadableStream` reader.
4. Completed drafts auto-save to Supabase. A failed save keeps the draft visible
   and offers **Retry saving**, using the same ID without another model call.
5. **Stop generating** cancels the provider request. Interrupted drafts are marked
   incomplete and are not saved. Markdown is rendered without raw HTML.

### API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/github/repos?page=1` | Repositories; `{items, nextPage}` (100/page) |
| GET | `/github/commits?repo=&branch=&since=&until=` | `{items, truncated}`; up to 500 commits |
| POST | `/changelog/generate` | Authenticated SSE; requires UUID v4 `generationId` |
| POST | `/changelog/save` | Retry a completed draft save; same ID and content |
| GET | `/history?cursor=` | Owned changelogs; `{items, nextCursor}` (50/page) |
| DELETE | `/history/:id` | Delete an owned changelog; 404 if unavailable |
| GET | `/health` | Public liveness check |

---

## 4. Deploy

Follow [docs/RELEASE.md](docs/RELEASE.md), including the database migration **before**
deploying the new backend, and the hosted smoke test.

**Backend → Railway**
- Root: `backend/` · Build: `npm run build` · Start: `npm run start:prod`
- Env vars: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PORT`,
  `FRONTEND_URL` (your Vercel URL, for CORS).

**Frontend → Vercel**
- Root: `frontend/`
- Env vars: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your Vercel URL),
  `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
  `NEXT_PUBLIC_API_URL` (your Railway URL).
- Update the GitHub OAuth App callback URL to
  `https://<your-app>.vercel.app/api/auth/callback/github`.

**Smoke test:** sign in, load a repo, generate, confirm it appears in History.

## Troubleshooting and checks

- An OAuth callback mismatch means the GitHub app callback must match `NEXTAUTH_URL` plus `/api/auth/callback/github`.
- If API requests fail, match `NEXT_PUBLIC_API_URL` to the backend and `FRONTEND_URL` to the browser origin.
- Missing history tables require applying [backend/supabase-schema.sql](backend/supabase-schema.sql) to your own Supabase project.
- Check each application with `npm run lint`, `npm run typecheck`, `npm test` and `npm run build`.
- Frontend browser tests: `npx playwright install chromium` then `npm run test:e2e`. They use isolated fixture data on port 3100.
- GitHub Actions runs these checks plus SQL permissions/quotas and `npm audit`.
- Generation is refused if storage/quotas are unavailable; restore Supabase and apply the schema before trying again.

Keep `SUPABASE_SERVICE_KEY`, OAuth secrets and the OpenAI key on the server. The generated changelog should be reviewed against the selected commits before publication.

## Product limits

Repository listing follows pages up to 10,000 repositories and reports an error if
it cannot complete. Commit ranges include at most the latest 500 commits, with an
explicit truncation warning. Input allows 60,000 message characters per generation;
narrow the dates if it is too large. Full commit bodies are retained, but no diffs
or PR content are fetched. Dates use UTC. Model output is capped at 4,096 tokens,
64,000 characters and 120 seconds.

Default quotas are 10 attempts/user and 100 total per rolling 24 hours; at most
one active request per user and three globally. Failed and cancelled attempts
count. Database reservations make these limits work across replicas. The API also
limits requests to 120/IP/minute per replica. History search covers the records
loaded so far; use **Load older changelogs** to include more.

Notion and Slack exports copy formatted text; they do not publish to those services.
Drafts that fail to save are kept in the current page only: retry or download them
before navigating away.
