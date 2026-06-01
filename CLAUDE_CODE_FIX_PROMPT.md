# Prompt for Claude Code — Make TakeToday Production-Ready

> Paste everything below into Claude Code running in your VS Code terminal at the repo root.
> A companion audit with full evidence lives at `TAKETODAY_AUDIT_REPORT.md`.

---

You are a senior full-stack + security engineer. This repo (`TakeToday`) contains a Next.js 15 app at `taketoday-app/`, a FastAPI service at `python-service/`, and a Prisma/Postgres schema. A full audit found the product is **not production-ready** (health 41/100). Your job is to fix the issues below and get it launch-ready.

**Read `TAKETODAY_AUDIT_REPORT.md` first** for full context and evidence. Then work through the phases below **in order** (blockers before nice-to-haves). 

## Ground rules
- Work in small, reviewable commits — one logical fix per commit with a clear message referencing the bug ID (e.g. `fix(auth): fail-closed admin allowlist [SEC-03]`).
- After each fix: run `cd taketoday-app && npm run typecheck && npm run lint && npm run test`. Don't move on if you've broken the build.
- Do NOT assume a fix works — verify against the actual code path, and add a regression test for every Critical/High fix.
- Before large changes, show me your plan and wait for confirmation. For the quick wins (Phase 0), just do them.
- Never weaken auth/security to make something "work." If a real fix needs a decision from me (e.g., email provider choice), stop and ask.
- Don't invent features beyond what's listed unless required to make a fix correct.

---

## Phase 0 — Quick wins (do these first, then report back)

1. **Fail-closed admin allowlist [SEC-03].** In `taketoday-app/lib/admin/rbac.ts`, `isAdminEmail()` returns `Boolean(email)` when the allowlist is empty — meaning any Google user becomes admin. Change it to return `false` when `ADMIN_EMAILS` is empty, and make the app refuse to treat anyone as admin in production without an explicit allowlist. Add a unit test proving an empty allowlist denies access.
2. **Fix scheduled publishing [BUG-07].** `vercel.json` cron is `30 1 * * *` (once daily) but `app/api/cron/publish/route.ts` is written to run every minute. Change the cron to `* * * * *` (or the most frequent your Vercel plan allows) so scheduled articles publish on time. Document the chosen cadence.
3. **Add security headers + CSP [SEC-04].** Add a `headers()` function in `taketoday-app/next.config.ts` with `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a sensible `Permissions-Policy`. Make the CSP compatible with Next, Sentry tunnel (`/monitoring`), Cloudinary, and Google avatars.
4. **Untrack committed env file [SEC-07].** `python-service/.env` is tracked in git. `git rm --cached python-service/.env`, ensure it's git-ignored, keep only `.env.example`. If any real secret was ever committed, list it so I can rotate it.
5. **Remove misleading middleware headers.** In `taketoday-app/middleware.ts`, delete the `x-admin-role` / `x-admin-id` response headers (they leak role info to the client and aren't used server-side).
6. **Escape JSON-LD [SEC-11].** Where `dangerouslySetInnerHTML` renders JSON-LD (`app/article/[slug]/page.tsx`, `app/page.tsx`, `app/category/[category]/page.tsx`), escape `<` to prevent `</script>` breakouts.
7. **Fix embeddings raw SQL [BUG-08].** In `lib/contributor/embeddings.ts:~92`, the `excludeId` branch nests `prisma.$queryRaw` templates inside another `$queryRaw` — invalid. Rewrite using `Prisma.sql` / `Prisma.join` / `Prisma.empty`. Add a test that the `excludeId` path produces valid SQL.

Report what you changed and the test results before continuing.

---

## Phase 1 — Launch blockers (the product can't ship without these)

8. **Connect the public site to the database [BUG-01 / SEC-01 — the #1 blocker].** The public pages (`app/article/[slug]`, `app/category/[category]`, `app/page.tsx`, search, trending) render static MDX via `lib/content/queries.ts` (`contentlayer/generated`) and never read the `Article` DB model. The admin CMS, AI pipeline, and cron all write to the DB that readers never see. 
   - Propose two options and recommend one: **(A)** render public articles directly from the DB (`prisma.article` with `status = PUBLISHED`), keeping ISR; or **(B)** a publish step that syncs DB → MDX/contentlayer. 
   - Implement the chosen path so admin-published, edited, and retracted/corrected articles appear on the public site. Preserve current SEO/OG/JSON-LD output. Keep the 20 existing MDX articles working (migrate them into the DB via a seed/migration script).
   - Add an integration test: create a PUBLISHED article in the DB → it renders at `/article/[slug]`; set it to ARCHIVED → it 404s.
9. **Replace admin mock data [BUG-02].** `lib/admin/data.ts` (hardcoded) and `components/admin/ModulePage.tsx` (hardcoded mock arrays + `console.log` filters) back the Dashboard, Analytics, Users, content search, filtering, and bulk actions. Wire these to real Prisma-backed API routes with working search/filter/pagination/empty/error states. Where a real data source genuinely doesn't exist yet, clearly label the screen as "Not implemented" rather than showing fake numbers.
10. **2FA: implement or remove [SEC-02 / BUG-04].** `app/admin/verify-2fa/page.tsx` is a dead-end stub, `auth.ts` never sets `twoFaVerified`, and `requireAdmin` never checks 2FA. Either implement real TOTP (e.g., `otplib`) with enrollment + verification that sets `twoFaVerified` in the JWT and is enforced in both the protected layout AND `requireAdmin`, or remove the feature and the misleading schema fields (`AdminUser.twoFactorReady`, `PublicUser.twoFactorEnabled/twoFactorSecret`). Ask me which you should do.
11. **Durable rate limiting & state [BUG-06].** Replace in-memory `Map`/`Set` state in `lib/admin/api.ts` (rate limit), `lib/content/generators/semaphore.ts`, and `lib/admin/authz.ts` (heartbeat) with a shared store (Upstash Redis recommended for Vercel). Also actually pass role into `rateLimit()` so the role tiers are used [BUG-20]. If you can't add Redis, tell me and stub a clear interface.
12. **Password reset + email verification [BUG-10].** Add forgot-password and reset flows and an email-verification flow for `PublicUser` (set `emailVerified`). Pick a transactional email approach (ask me — Buttondown is newsletter-only; suggest Resend or similar). Add rate limiting to these and to register/login [SEC-06].
13. **Fix contributor Google sign-in [BUG-09].** In `lib/contributor/auth.ts`, the `jwt` callback only populates contributor fields if a `PublicUser` already exists, so new Google users get no usable session. Auto-create a `PublicUser` (with a generated unique username + reputation row) on first Google sign-in, and implement the referenced `/contribute/onboarding` page.
14. **Prisma migration baseline [BUG-14].** The schema has 60+ models but only two migration folders (drift — likely applied via `db push`). Create a clean, reproducible migration baseline that matches the current schema (including the pgvector column), so deploys and rollbacks are safe. Verify `prisma migrate deploy` works from scratch against an empty DB.

---

## Phase 2 — Important post-stabilization fixes

15. **Stale-session authorization [SEC-05 / BUG-11].** Role, tier, and `suspendedAt` come from the JWT, so suspensions/role changes don't take effect until token expiry. Re-validate against the DB on sensitive actions (publish, moderate, vote weighting, admin writes) and shorten token TTL. Also enforce `AdminUser.revokedAt`.
16. **Missing foreign-key indexes [BUG-13].** Add `@@index` for: `Evidence.submittedById`, `FactCheck.checkerId`, `CommunityVote.userId`, `EditorialDecision.editorId`, `Correction.correctedById`, `MediaAsset.folderId`, `SocialPost.articleId`, `AnalyticsEvent.articleId`, `ReviewComment.articleId`. Generate a migration.
17. **Over-fetch on `GET /api/contribute/[id]` [BUG-16].** Paginate/trim the nested includes (versions, transparencyLogs, evidence, votes, notes) instead of loading everything.
18. **Python service hardening [BUG-15 / SEC-08 / SEC-09].** Consolidate the divergent token checks (`app/main.py` weak vs `core/security.py` JWT) onto one verified-JWT dependency; replace the deprecated `@app.on_event` with lifespan handlers; make the in-memory job queue durable (DB/Redis) and multi-worker-safe; add SSRF protection to the scraper (host allowlist, block internal IPs, per-request timeout, response-size cap).
19. **`publishLogs` history [BUG-12].** Append to the publish-log JSON instead of overwriting it in `cron/publish`.
20. **Consolidate duplicate enums** `ContributionStatus` vs `WorkflowStage`, and remove the dead/duplicate root Next app (`/app`, `/components`, `/lib` at repo root) [BUG-17] once you confirm it's unused.

---

## Phase 3 — Tests, CI, and ops

21. **Test suite.** Add tests (Vitest + Playwright) for: RBAC/authz incl. the fail-open regression (SEC-03), contribution lifecycle + ownership 403s, cron publishing semantics, embeddings SQL, auth callbacks (admin + contributor incl. Google new-user), and an E2E public-read + contributor happy path. Wire `typecheck`/`lint`/`test`/coverage into the existing `.github` CI workflow as required gates.
22. **Ops.** Add uptime/health monitoring beyond Sentry, document a backup/restore runbook (RPO/RTO) for Postgres, and verify the production build (`npm run build`) and a bundle analysis (code-split the TipTap editor + firebase off public routes).
23. **Dependency check [BUG-18].** Verify `lucide-react@^1.16.0` resolves correctly and pin `next-auth` off beta when a stable release is suitable.

---

## Deliverables when done
- A short `PRODUCTION_READINESS.md` summarizing what changed, what's tested, remaining risks, and any decisions you need from me.
- All Critical/High items fixed and covered by tests, green CI, and a working `npm run build`.
- A list of any secrets I need to rotate or env vars I need to set (with names, in `.env.example`).

Start with Phase 0 now and report back before Phase 1.
