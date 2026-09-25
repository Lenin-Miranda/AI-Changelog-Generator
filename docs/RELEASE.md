# Release procedure

The source fixes are not evidence that the hosted application has been released.
Use Node 22 (see `.nvmrc`) for both applications. CI runs lint, type checks,
unit/HTTP tests, production builds, browser scenarios, npm audit and PostgreSQL
security/quota checks without real credentials.

## Database first

1. Restore the intended Supabase project if it is paused. Confirm the project ref
   before applying anything; do not use an unrelated project.
2. Review `supabase/migrations/20260925071443_secure_changelog_storage.sql`.
   It is additive and rerunnable: existing changelogs stay intact. It enables RLS,
   removes browser/public grants and adds server-only generation reservations.
3. Run `supabase link --project-ref <ref>`, then `supabase db push --dry-run` and
   `supabase db push`. Alternatively run `backend/supabase-schema.sql` in that
   project's SQL editor. Do not use `db reset` against a remote database.
4. In SQL, verify `relrowsecurity` is true for `public.changelogs` and
   `public.generation_requests`, and `has_table_privilege('anon',
   'public.changelogs', 'select')` is false. Verify `authenticated` also lacks
   CRUD grants and neither role can execute `reserve_generation`.
5. The service role is privileged: all API reads/writes must retain their
   verified GitHub ownership filters. This app does not use Supabase Auth IDs.

## Backend (Railway)

Set service root to `backend/` and config path to `/backend/railway.json`.
The Dockerfile builds on Node 22, installs from the lockfile and runs as a
non-root user. Supply `OPENAI_API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_KEY`, `FRONTEND_URL` and Railway's `PORT`.
Production URLs must use HTTPS; `FRONTEND_URL` must be the exact browser origin.
Supply the two generation quotas from `.env.example` (defaults 10/user and
100/global per rolling 24 hours). Set `TRUST_PROXY_HOPS` only after checking the
actual proxy chain; leave 0 for direct access. The in-memory 120 requests/IP/minute
limit is per replica; model quotas are enforced atomically in Postgres.

`GET /health` is a public liveness check; it does not verify provider credentials
or database readiness. Preserve streaming responses, disable proxy buffering and
allow at least 120 seconds for generation. CORS allows only the configured origin.
Logs include generation ID, elapsed milliseconds, outcome and provider-reported
input/output token counts when available. They omit credentials,
commit text or repository content. Retention of quota reservations is 30 days.

## Frontend (Vercel)

Import the repository with root `frontend/`, framework Next.js, Node 22 and
`npm run build`. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET` and `NEXT_PUBLIC_API_URL` (the backend HTTPS origin).
Changing the public API URL requires rebuilding. Configure the GitHub OAuth App
callback to `<NEXTAUTH_URL>/api/auth/callback/github`; use separate OAuth apps for
local/staging/production if their callbacks differ. NextAuth's GitHub token remains
in the browser session; never store it in logs or persist it in application tables.

## Required hosted smoke test

Record the deployed commit and URLs. With a test GitHub account:

- Sign in via the actual OAuth callback; list both public and private repositories.
- Change branch/dates after loading commits; verify generation stays disabled until
  the new selection is loaded. Check the warning for ranges above 500 commits.
- Generate one small draft; verify it says saved, reload History, export/download
  it and delete only that test record.
- Stop another generation; confirm upstream cancellation in logs and that no
  incomplete record is stored. Cancelled requests still consume an attempt quota.
- Temporarily simulate a storage failure in staging; confirm retry saving preserves
  the same ID and does not call the model again.
- Check unauthenticated history/generation return 401; a second user cannot read or
  delete the first user's draft. Check direct anon Supabase access is denied.
- Check mobile, keyboard focus, reduced motion, expired-session reconnection and
  long-running streaming through the real proxy.

Local browser tests use mocked sessions/providers. They do not replace this test.
On 2026-09-25 the discoverable `AI-Changelog-Generator` Supabase project was
reported `INACTIVE`; no remote migration or hosted smoke test was performed.

## Rollback

Keep the previous frontend/backend deployment IDs. Promote the previous known-safe
pair if needed; never roll back to an API revision that trusts client `userId`.
Keep RLS and the additive reservation table in place. Do not drop user data or
remove access restrictions to restore availability. If a migration fails, stop the
release and inspect it before deploying the API that depends on it. Set the model
provider's project budget/alerts as an additional operational control.

## References

- [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [NestJS migration guide](https://docs.nestjs.com/migration-guide)
- [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api)
