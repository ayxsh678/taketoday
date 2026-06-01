# TakeToday — Full Product Audit & QA Review

**Reviewer roles:** Senior QA, Product, Security, UX, Full-Stack
**Method:** Static evidence-based review of source, Prisma schema, config, tests, and git state. The live app/DB were not executed, so runtime-only issues (visual rendering, real latency, live data) are flagged as "verify at runtime."
**Date:** 2026-05-31
**Scope reviewed:** `taketoday-app/` (Next.js 15 app — public site, admin CMS, contributor platform, 58 API routes), `python-service/` (FastAPI automation), Prisma schema (60+ models), config, tests, git.

---

## Executive Summary

TakeToday is an **ambitious, three-products-in-one** codebase: (1) a public AI-generated news site, (2) an admin content-management + AI-generation pipeline, and (3) an "open journalism" contributor platform with reputation, fact-checking, investigations, missions, and gamification. The **data model and architectural intent are genuinely strong** — a thoughtful 60+ model schema with transparency logs, versioning, editorial workflow, and pgvector semantic search.

However, **the product is not production-ready.** The single most serious problem is that **the public news website is completely disconnected from the admin CMS and the content pipeline** — readers see static MDX files, while everything the admin panel, AI pipeline, and scheduled cron produce lives in a database the public pages never read. On top of that, **large portions of the admin panel render hardcoded mock data**, **2FA is a non-functional stub**, the **admin allowlist fails open**, rate-limiting and concurrency control rely on **in-memory state that breaks on serverless**, and there is **near-zero automated test coverage of critical flows**.

### Overall Health Score: **41 / 100**

| Dimension | Score | Notes |
|---|---|---|
| Architecture & data model design | 72 | Excellent schema; but two content systems are disconnected |
| Functional completeness | 30 | Core CMS→site flow broken; admin largely mocked |
| Security | 38 | Fail-open admin, stub 2FA, no headers, stale-session authz |
| Database | 60 | Good relations; missing FK indexes; migration drift |
| Performance | 55 | Static site fast; over-fetching + ineffective caches |
| UX / Accessibility | 50 | Radix + design system good; dead-end & mock screens |
| Scalability | 35 | In-memory state, single-instance Python queue |
| Test coverage | 15 | 5 JS test files, 3 Python; critical flows untested |
| Production readiness | 30 | Not ready beyond a small pilot |

---

## Phase 1 — System Architecture Overview

### Architecture Diagram (logical)

```
                          ┌─────────────────────────────────────────────┐
                          │              Readers (public)                │
                          └───────────────┬─────────────────────────────┘
                                          │
                 ┌────────────────────────▼─────────────────────────┐
                 │   Next.js 15 App (taketoday-app) — Vercel         │
                 │                                                   │
   ┌─────────────┤  PUBLIC NEWS SITE                                 │
   │ Contentlayer│   /, /article/[slug], /category/[c], /search ...  │
   │  MDX (20    │   ►► reads STATIC MDX  ◄◄  (NOT the database)     │
   │  .mdx files)│                                                   │
   └─────────────┤  CONTRIBUTOR PLATFORM (DB-backed)                 │
                 │   /contribute, /profile, /investigate, /missions  │
                 │   /leaderboard   ── NextAuth (Credentials+Google) │
                 │                                                   │
                 │  ADMIN CMS  /admin/* + /api/admin/*               │
                 │   NextAuth (Google) + email allowlist RBAC        │
                 │   ►► many pages render MOCK data (lib/admin/data) │
                 │                                                   │
                 │  /api/cron/publish  (Vercel Cron — DB only)       │
                 └───────┬───────────────────────────┬───────────────┘
                         │ Prisma                     │ serviceProxy (Bearer)
                 ┌───────▼─────────┐          ┌───────▼────────────────────┐
                 │ PostgreSQL      │          │ Python FastAPI service      │
                 │ + pgvector      │◄─────────┤ scraper / AI / publisher    │
                 │ (60+ models)    │ asyncpg  │ in-memory job queue + APS   │
                 └─────────────────┘          └───────┬─────────────────────┘
                                                      │
                            OpenAI · Gemini · Groq · OpenRouter · Mistral ·
                            Cloudinary · Buttondown · Firebase · Sentry · socials
```

### User Roles

**Admin roles** (`AdminRole`, assigned by email allowlist in env vars): `SUPER_ADMIN`, `EDITOR`, `CONTENT_MANAGER`, `SOCIAL_MEDIA_MANAGER`, `ANALYST` (default). Permissions defined in `lib/admin/rbac.ts`.

**Contributor roles** (`ContributorRole` on `PublicUser`): `READER`, `CONTRIBUTOR` (default), `RESEARCHER`, `FACT_CHECKER`, `JOURNALIST`, `EXPERT_REVIEWER`, plus reputation tiers `NEWCOMER → STAFF`.

### Integrations
NextAuth (Google + Credentials), OpenAI, Google Gemini, Groq, OpenRouter, Mistral, Cloudinary (media), Buttondown (newsletter), Firebase, Sentry (configured well), and social publishing targets (X, Instagram, WhatsApp, Telegram, Facebook, LinkedIn, YouTube, Threads).

### API Inventory (58 route handlers)
- **Admin** (`/api/admin/*`, 23 routes): articles CRUD, health, stream (SSE), automation proxy, settings, plus module endpoints.
- **Auth:** `/api/auth/[...nextauth]` (admin Google), `/api/contributor-auth/[...nextauth]` (contributor).
- **Contributor:** register, profile, reputation, streaks, badges, activity, `[username]`.
- **Contribute:** create/list, `[id]` (GET/PATCH/DELETE), vote, note, fork, evidence, fact-check, citation.
- **Platform:** investigations, missions, leaderboard, presence, enrich, search + search/semantic, translate, subscribe, ticker, categories, contribute, og (image), feed.xml, cron/publish.

### Database Models
60+ Prisma models across four domains: **Editorial CMS** (Article, Category, Tag, MediaAsset, Source, Job, SocialPost, ShortVideoJob, AuditLog…), **Open Journalism** (Contribution + versions/evidence/citations/fact-checks/votes/notes, Investigation, ResearchBoard/Card), **Contributor Economy / Phase D** (reputation, badges, missions, streaks, leaderboards, trust flags), and **Multi-provider AI / Phase E** (AIProviderSetting, AITaskRoute, AIUsageEvent).

---

## Phase 2 — Functional Testing

### Feature Status Table

| Feature | Status | Issues found |
|---|---|---|
| Public homepage / article / category pages | ⚠️ Works but **DB-disconnected** | Renders static MDX only (`contentlayer/generated`); ignores DB articles |
| SEO / metadata / OG / structured data | ✅ Good | NewsArticle + Breadcrumb JSON-LD, OG via `/api/og`; minor escaping nit |
| Public search / semantic search | ⚠️ Partial | Semantic `excludeId` path has invalid raw SQL (see BUG-08) |
| Admin login (Google) | ✅ Works | But fails open if `ADMIN_EMAILS` unset (SEC-03) |
| Admin 2FA | ❌ **Stub** | No provider; `twoFaVerified` never set; enabling it locks admins out |
| Admin dashboard / analytics | ❌ **Mock data** | `lib/admin/data.ts` hardcoded (182 lines) |
| Admin content list / search / filter | ❌ **Mock data** | `ModulePage.tsx` uses hardcoded arrays; filter only `console.log`s |
| Admin article CRUD (API) | ✅ Solid | Zod, RBAC, transaction, audit log, P2002/P2003 handling |
| User / contributor management | ❌ Mostly mock | List from mock snapshot; no verified CRUD wiring |
| Content pipeline (article/image/video/carousel) | ⚠️ Built, fragile | Orchestrated, idempotency keys; depends on single Python instance |
| Scheduled publishing (cron) | ⚠️ **Bug** | Cron runs once/day at 01:30 UTC, not per-minute (BUG-07) |
| Newsletter broadcast | ✅ Plausible | Buttondown fire-and-forget on publish |
| Contributor register | ⚠️ Works | No email verification, no rate limit, user enumeration |
| Contributor login (credentials) | ✅ Works | bcrypt(12), suspended check; no brute-force protection |
| Contributor login (Google) | ❌ **Broken for new users** | No PublicUser created on Google sign-in (BUG-09) |
| Password reset / forgot password | ❌ **Missing** | No route, no email flow |
| Contribution create/edit/delete | ✅ Solid | Ownership checks, stage gating, version snapshots, transparency log |
| Voting / notes / fact-check / evidence | ✅ Reasonable | Self-vote blocked; reputation-weighted; stale-tier from JWT |
| Investigations / research boards | ⚠️ Built | Verify at runtime; auth present |
| Missions / leaderboard / badges / streaks | ⚠️ Built | Gamification logic present; not test-covered |

### Authentication findings
- Two **separate** NextAuth instances (admin = Google only; contributor = Credentials + Google), both JWT strategy. Reasonable separation.
- **Admin role is derived from email** on every JWT callback (`roleFromEmail`) — no DB-backed role, so revoking access requires editing env vars + redeploy. `AdminUser.revokedAt` exists but is never enforced.
- Protected routes: `middleware.ts` gates `/admin` and `/api/admin` on `session.user.isAdmin` only — **no permission and no 2FA check at the edge.** Per-route permission checks happen via `requireAdmin(permission)` (used in 21/23 admin routes; `health` and `stream` excluded — acceptable).
- `middleware.ts` sets `x-admin-role`/`x-admin-id` on the **response** (not the forwarded request). Downstream handlers correctly use the session via `requireAdmin`, not these headers, so there is no privilege-escalation via header spoofing today — but the headers are also echoed to the client and the pattern is misleading. Remove them.

### Content pipeline findings
- Clean strategy-pattern orchestrator (`lib/content/generators/pipeline.ts`) with a generator registry, idempotency keys, semaphore concurrency, orphan-job cleanup, and `Promise.allSettled` fan-out. Good design.
- **Failure points:** the semaphore and orphan-cleanup flag are module-level in-memory state — on serverless they reset per cold start, so concurrency limits and "run once" guarantees do not hold across instances. The Python job queue is in-memory and single-instance (jobs and status lost on restart).
- **Race conditions:** idempotency is enforced via a unique `Job.idempotencyKey` (good), but cross-instance concurrency caps are not enforced.

---

## Phase 3 — Database Audit

**Strengths:** consistent `cuid()` PKs, sensible cascade deletes on child tables, composite PKs on join tables, unique constraints on natural keys (slug, email, username), good use of `@@index` on hot paths (Article status/publishedAt/scheduledAt, Contribution status/author/stage). pgvector added via raw SQL migration (`add_vector_search.sql`) — appropriate.

**Issues:**

- **Missing indexes on foreign keys** (cause sequential scans / slow joins at scale): `Evidence.submittedById`, `FactCheck.checkerId`, `CommunityVote.userId`, `EditorialDecision.editorId`, `Correction.correctedById`, `MediaAsset.folderId`, `SocialPost.articleId`, `AnalyticsEvent.articleId`, `ReviewComment.articleId`. Add `@@index` on each.
- **Migration drift (HIGH):** 60+ models but only **two** migration folders (`phase_d`, `add_threads_and_video_template`) plus loose SQL. The bulk of the schema has no migration history → it was likely applied with `prisma db push`. This makes deployments non-reproducible and rollbacks dangerous. Reconcile into a clean migration baseline.
- **Duplicate enums:** `ContributionStatus` and `WorkflowStage` are near-identical and both stored on `Contribution`. They will drift; collapse to one source of truth.
- **`publishLogs` (Json) is overwritten** on each publish in `cron/publish` rather than appended — audit history is lost.
- **Over-fetch / read amplification:** `GET /api/contribute/[id]` eager-loads all versions, all transparency logs, all evidence, all citations, all fact-checks, all votes and notes with author joins in one query — payloads and query cost grow unbounded with activity. Paginate nested collections.
- **Orphaned-record risk:** several relations lack `onDelete` rules (e.g., `Article.author`, `SocialPost.article`, `FactCheck.checker`), so deleting a referenced user/article can fail or strand rows depending on usage.
- **Data integrity:** scores (`confidenceScore`, `biasScore`, reputation dimensions) are unconstrained floats — no DB-level range checks; rely entirely on app code.

---

## Phase 4 — Security Audit

| ID | Severity | Finding | Evidence | Remediation |
|---|---|---|---|---|
| SEC-01 | **Critical** | **Public site ↔ CMS disconnect** is also a content-integrity issue: published/edited/retracted DB articles never reach readers; corrections cannot be pushed live | `lib/content/queries.ts` (contentlayer), no public page reads `prisma.article` | Render public articles from DB (or sync pipeline → MDX) before launch |
| SEC-02 | High | **2FA is a non-functional stub**; enabling `NEXT_PUBLIC_REQUIRE_2FA` locks admins out, leaving it off provides no protection; API layer never checks 2FA | `app/admin/verify-2fa/page.tsx`, `auth.ts` (twoFaVerified always false), `requireAdmin` has no 2FA check | Implement real TOTP/WebAuthn or remove the feature + misleading schema fields |
| SEC-03 | High | **Admin allowlist fails open**: if `ADMIN_EMAILS` is empty, `isAdminEmail` returns `true` for any authenticated Google user (default role Analyst → admin dashboard/content/analytics read) | `lib/admin/rbac.ts:64-68` | Fail closed: return `false` when allowlist empty; require explicit allowlist in prod |
| SEC-04 | High | **No security headers / CSP** — clickjacking, MIME sniffing, no HSTS | `next.config.ts` has no `headers()` | Add CSP, HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| SEC-05 | High | **Stale-session authorization**: role, tier and `suspendedAt` come from the JWT; suspending or demoting a user has no effect until token expiry | `lib/contributor/auth.ts` jwt/session, `authz.ts` | Re-validate critical state against DB on sensitive actions; shorten token TTL |
| SEC-06 | Medium | **No rate limiting on auth/registration/contribution** create endpoints → brute force, account/content spam | `register/route.ts`, contributor credentials provider, `contribute/route.ts` | Add IP+account rate limiting (durable store) and CAPTCHA on register |
| SEC-07 | Medium | **Committed `python-service/.env`** (currently placeholders) tracked in git; `.gitignore` won't help once tracked → latent real-secret leak | `git ls-files` shows `python-service/.env` | `git rm --cached`, keep only `.env.example`, rotate any real values ever committed |
| SEC-08 | Medium | **Python service auth inconsistency**: `app/main.py` has a weak inline token check while `core/security.py` does real JWT — divergent code paths | `python-service/app/main.py` vs `core/security.py` | Consolidate on one verified-JWT middleware |
| SEC-09 | Medium | **SSRF / unbounded fetch in scraper** — fetches arbitrary source URLs with no host allowlist, scheme check, size cap or per-request timeout | `python-service/app/tasks/scraper.py` | Allowlist hosts, block internal IP ranges, set timeouts and response-size limits |
| SEC-10 | Low | **User enumeration** on register (distinct "email taken" vs "username taken" 409s) | `register/route.ts:32-37` | Use generic messaging where feasible |
| SEC-11 | Low | **JSON-LD via `dangerouslySetInnerHTML`** with `JSON.stringify` not escaping `<`/`</script>` (inputs are controlled MDX, low risk) | `app/article/[slug]/page.tsx`, `app/page.tsx` | Escape `<` to `<` in the serialized LD |
| SEC-12 | Low | **next-auth `5.0.0-beta`** in production; beta API churn risk | `package.json` | Pin and track stable release |

**Positives:** parameterized Prisma queries throughout (no SQL injection surface in app code), bcrypt cost 12, Zod validation on most mutation routes, cron protected by `CRON_SECRET`, Sentry wired, secrets read server-side only (non-`NEXT_PUBLIC` vars resolve to empty on the client, so no secret bundling despite `appConfig` being imported by a `"use client"` file — fragile but not leaking today).

---

## Phase 5 — Performance Audit

- **Public site:** static MDX + ISR (`revalidate = 3600`) + `generateStaticParams` → fast, cacheable, CDN-friendly. The fastest part of the product — ironically because it ignores the DB.
- **Backend hotspots:** `GET /api/contribute/[id]` over-fetch (see DB audit); missing FK indexes will slow contributor/profile/leaderboard queries as data grows.
- **Caching:** in-memory rate-limit/semaphore/heartbeat caches are **ineffective on serverless** and provide false confidence. Move to Redis/Upstash.
- **Bundle:** heavy client libs (TipTap editor suite, framer-motion, firebase, radix). Verify the firebase SDK isn't pulled into public bundles; code-split the editor to contributor routes only. (Exact bundle sizes need a runtime `next build --analyze`.)
- **Python service:** synchronous `BackgroundScheduler` inside an async app and a threaded in-memory queue cap throughput to one instance; long scrapes/AI calls can starve the event loop.

---

## Phase 6 — UX / UI Audit

- **Design intent is strong:** a documented `design-system.md`, Tailwind v4, Radix primitives (accessible by default), `next-themes`. The journalism-platform concepts (transparency logs, corrections, community notes, reputation) are excellent trust signals.
- **Major UX breakages:**
  - Admin **Dashboard / Analytics / Users / content search & filter render mock data** — operators would be misled by fake numbers and unable to actually search.
  - **2FA page is a dead end** ("provider not connected") — anyone who enables it is stuck.
  - **No password reset** and **no email verification** — standard account flows missing.
  - **Google sign-in for new contributors silently fails** to create a usable session.
- **Accessibility:** Radix helps, but a full WCAG pass needs the running app (color contrast, focus order, labels). JSON-LD is fine. Recommend running the included `design:accessibility-review` skill against live screens.
- **Onboarding:** a `/contribute/onboarding` page is referenced as NextAuth `newUser` but the creation logic is absent — onboarding is incomplete.

---

## Phase 7 — Production Readiness / Scalability

| Users | Verdict | Limiting factor |
|---|---|---|
| 100 | ⚠️ Pilot-only | Works if env fully configured and stakeholders accept mock admin + static public content |
| 1,000 | ❌ | In-memory rate limits/caches break across instances; mock admin misleads ops; no password reset |
| 10,000 | ❌ | Missing FK indexes slow queries; single-instance Python queue bottlenecks; no durable jobs |
| 100,000 | ❌ | Needs Redis, durable queue/worker fleet, DB read replicas + indexing, full observability |

- **Monitoring:** Sentry configured (client/server/edge + tunnel) — good baseline. No metrics/APM/uptime checks.
- **Logging:** structured JSON to stdout in places (cron, pipeline) — inconsistent elsewhere.
- **Error handling:** `captureApiError` + Zod give consistent API errors; good. Many UI modules swallow errors into mock fallbacks.
- **Deployment:** Vercel (Next) + separate Python host; `vercel.json` cron; `build` runs `prisma generate`. **No reproducible migrations** for most tables (drift).
- **Backups / recovery:** not addressed in repo — depends on the managed Postgres provider; no documented RPO/RTO or restore runbook.

---

## Phase 8 — Automated Testing Review

- **JavaScript:** 5 files only — `semaphore.test.ts`, `retry.test.ts`, `api/approvals.test.ts`, `api/health.test.ts`, plus `setup.ts`. Vitest configured.
- **Python:** 3 files — `test_integration.py`, `test_prisma.py`, `test_security.py`.
- **Untested critical flows:** admin RBAC & permission gates, the fail-open allowlist, contribution workflow transitions, ownership checks, cron publishing, embeddings/semantic search, pipeline orchestration, auth callbacks, rate limiting.

**Testing roadmap (priority order):**
1. RBAC/authz unit tests incl. the fail-open allowlist regression (SEC-03).
2. Contribution lifecycle integration tests (create → submit → edit gating → delete-only-draft → ownership 403s).
3. Cron publish behavior incl. schedule semantics (BUG-07).
4. Embeddings raw-SQL composition (BUG-08).
5. Auth callback tests (admin + contributor, incl. Google new-user path BUG-09).
6. E2E (Playwright) for the public read path and a contributor happy path.
7. Wire coverage gates into CI (the `.github` workflow).

---

## Bugs Found (by severity)

**Critical**
- **BUG-01 / SEC-01 — Public website does not read the database.** Admin/pipeline/cron output never reaches readers; corrections/retractions can't go live. `lib/content/queries.ts`, `app/article/[slug]/page.tsx`.

**High**
- **BUG-02 — Admin dashboard/analytics/users are hardcoded mock data.** `lib/admin/data.ts`, `components/admin/ModulePage.tsx`.
- **BUG-03 / SEC-03 — Admin allowlist fails open** when `ADMIN_EMAILS` is empty. `lib/admin/rbac.ts:64`.
- **BUG-04 / SEC-02 — 2FA is a stub**; enabling it locks admins out; API never checks it.
- **BUG-05 / SEC-04 — No security headers / CSP.**
- **BUG-06 — In-memory rate limiting / semaphore / heartbeat** ineffective on serverless. `lib/admin/api.ts`, `generators/semaphore.ts`, `lib/admin/authz.ts`.
- **BUG-07 — Scheduled publishing delayed up to ~24h:** cron is `30 1 * * *` (daily) but logic assumes per-minute. `vercel.json` vs `app/api/cron/publish/route.ts`.
- **BUG-08 — Semantic search `excludeId` builds invalid SQL:** nesting `prisma.$queryRaw\`...\`` inside another `$queryRaw` template. Use `Prisma.sql`/`Prisma.join`/`Prisma.empty`. `lib/contributor/embeddings.ts:92`.
- **BUG-09 — Contributor Google sign-in broken for new users:** no `PublicUser` is created, so `session.contributor` is undefined. `lib/contributor/auth.ts` jwt callback.

**Medium**
- BUG-10 — No password reset / email verification (`emailVerified` never set).
- BUG-11 — Stale-session authz: suspension/role/tier read from JWT (SEC-05).
- BUG-12 — `publishLogs` Json overwritten, losing audit history.
- BUG-13 — Missing FK indexes (see DB audit).
- BUG-14 — Migration drift; no reproducible baseline.
- BUG-15 — Python service: divergent auth, deprecated `@app.on_event`, in-memory job queue (non-durable, single instance).
- BUG-16 — Over-fetch on `GET /api/contribute/[id]`.

**Low**
- BUG-17 — Two parallel Next apps (root `app/` + `taketoday-app/`) — dead/confusing code.
- BUG-18 — `lucide-react` pinned to `^1.16.0` (suspicious major) — verify dependency resolves; `next-auth` beta.
- BUG-19 — JSON-LD not escaping `<` (SEC-11).
- BUG-20 — Rate-limit role tiers defined but never passed (everyone gets the default 60/min).
- BUG-21 — 127 TODO/stub/"in a real implementation" markers across `app/lib/components`.

---

## Missing Features
Password reset, email verification, working 2FA, DB-backed public rendering, contributor onboarding completion, real admin dashboard/analytics/search/bulk-actions, durable job queue, moderation tooling wired to data, backup/restore runbook, CI test/coverage gates.

## Quick Wins (high impact, low effort)
1. **Fail closed** in `isAdminEmail` when allowlist is empty (one-line fix, removes a critical exposure).
2. **Fix cron schedule** to `* * * * *` (or document daily intent) — restores scheduled publishing.
3. **Add security headers/CSP** via `next.config.ts` `headers()`.
4. **`git rm --cached python-service/.env`** and rotate any committed secrets.
5. **Remove the misleading `x-admin-role`/`x-admin-id` response headers** from middleware.
6. **Escape `<`** in JSON-LD output.
7. **Hide or label mock admin screens** so operators aren't misled.
8. **Fix the embeddings `excludeId` SQL** with `Prisma.sql`.

## Launch Blockers (must fix before public launch)
1. Connect the public site to the database (BUG-01) — *the* blocker.
2. Replace admin mock data with real queries, or clearly gate those screens (BUG-02).
3. Fail-open admin allowlist (BUG-03).
4. 2FA: implement or remove (BUG-04).
5. Security headers/CSP (BUG-05).
6. Durable rate limiting + remove false in-memory guarantees (BUG-06).
7. Cron publishing schedule (BUG-07).
8. Password reset + email verification (BUG-10).
9. Contributor Google sign-in (BUG-09).
10. A migration baseline (BUG-14).

## Post-Launch (important, not blocking)
Over-fetch/pagination, FK indexes (do before real traffic), Python durable queue/worker fleet, stale-session re-validation, SSRF hardening, bundle analysis/code-splitting, full WCAG audit, consolidate duplicate enums, retire the root duplicate app, expand test suite and CI gates, APM/uptime monitoring, backup/restore runbook.

---

## Final Answers

**1. Is TakeToday production ready?**
No. It is a strong prototype with an excellent data model, but the core CMS→website flow is disconnected, much of the admin panel is mock data, several auth/security gaps exist, and critical flows are untested. Suitable only for a controlled internal pilot today.

**2. What would break first under scale?**
The in-memory rate limiter / semaphore / heartbeat (they silently stop working the moment Vercel runs more than one instance), closely followed by un-indexed foreign-key queries on the contributor tables and the single-instance Python job queue.

**3. What should be fixed before launch?**
The ten launch blockers above — above all, making the public site render from the database, removing admin mock data, closing the fail-open allowlist, shipping or removing 2FA, adding security headers, and restoring scheduled publishing.

**4. What should be fixed after launch?**
Query/pagination optimization, FK indexes, durable Python queue, stale-session re-validation, SSRF hardening, bundle/code-split work, accessibility audit, enum consolidation, removing the duplicate root app, and building out tests + monitoring + backups.

**5. Top 20 highest-impact improvements**
1. Render public articles from the DB (or auto-sync pipeline → MDX). *(Critical)*
2. Fail-closed admin allowlist. *(Critical/quick)*
3. Replace admin mock data (dashboard/analytics/users/search) with real queries.
4. Implement real 2FA (TOTP/WebAuthn) or remove it + the schema fields.
5. Add CSP + full security-header set.
6. Move rate limiting/concurrency to Redis/Upstash.
7. Fix cron schedule (restore scheduled publishing).
8. Add password reset + email verification.
9. Fix contributor Google sign-in (auto-create PublicUser).
10. Fix the embeddings `excludeId` raw-SQL composition.
11. Establish a clean Prisma migration baseline.
12. Add missing foreign-key indexes.
13. Paginate / trim `GET /api/contribute/[id]` over-fetch.
14. Re-validate suspension/role against DB on sensitive actions.
15. Make the Python job queue durable (DB/Redis) and multi-worker.
16. SSRF allowlist + timeouts + size caps in the scraper.
17. Remove committed `.env`; rotate secrets; enforce `.env.example` only.
18. Build a real test suite for auth/RBAC/workflow + CI coverage gates.
19. Remove the duplicate root Next app and dead/mock code.
20. Add monitoring (APM/uptime) and a backup/restore runbook.

---

*Evidence is cited by file path throughout. Items marked "verify at runtime" require running the app/DB, which was outside this static review. No feature was assumed to work; each status reflects what the source, schema, config, tests, or git state actually show.*
