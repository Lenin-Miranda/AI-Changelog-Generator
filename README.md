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

> **Using Claude instead of OpenAI?** It's a one-file swap in
> `backend/src/changelog/changelog.service.ts` (`generateStream`): replace the
> OpenAI streaming call with the Anthropic SDK (e.g. `claude-haiku-4-5`). The
> prompt is model-agnostic.

## 2. Configure environment

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
```
