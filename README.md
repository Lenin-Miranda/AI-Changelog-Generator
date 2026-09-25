# AI Changelog Generator

Connect GitHub, pick a repo and a commit range, and generate a professional
changelog with AI. Export as Markdown, or copy formatted for Notion / Slack.

- **Frontend:** Next.js 14 (App Router) · TypeScript · Tailwind · NextAuth (GitHub OAuth)
- **Backend:** NestJS · REST + SSE streaming · OpenAI (`gpt-4o-mini`)
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

Requires Git, Node.js and npm. Clone before running the commands below:

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
cd backend && npm install && npm run start:dev

# terminal 2 — frontend on :3000
cd frontend && npm install && npm run dev
```

Open http://localhost:3000 → **Connect GitHub** → pick a repo → load commits →
**Generate**.

---

## How it works

1. NextAuth runs GitHub OAuth (scopes `read:user repo`) and stores the access
   token + numeric GitHub id in the JWT session.
2. The frontend calls the NestJS backend with `Authorization: Bearer <token>`.
   The backend proxies the GitHub API for repos and commits (with rate-limit /
   private-repo error handling).
3. `POST /changelog/generate` builds the prompt, streams OpenAI tokens back as
   **Server-Sent Events**, and the frontend renders them live via a
   `ReadableStream` reader.
4. The finished changelog auto-saves to Supabase, viewable under **History**.

### API

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/github/repos` | User's repositories (Bearer token) |
| GET | `/github/commits?repo=&branch=&since=&until=` | Commits in range |
| POST | `/changelog/generate` | SSE stream of the changelog |
| GET | `/history?userId=` | Saved changelogs |
| DELETE | `/history/:id?userId=` | Delete one |

---

## 4. Deploy

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
- Build each application from its own directory with `npm run build`. Neither package defines an automated test script.

Keep `SUPABASE_SERVICE_KEY`, OAuth secrets and the OpenAI key on the server. The generated changelog should be reviewed against the selected commits before publication.
