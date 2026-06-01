# TakeToday — Production Readiness Report

**Date:** 2026-06-01  
**Starting health:** 41/100 (see `TAKETODAY_AUDIT_REPORT.md`)  
**Estimated health after fixes:** ~74/100

---

## 1. Architecture Overview

```
Readers (public)
     │
     ▼
Next.js 15 (Vercel) — taketoday-app/
├── Public site:   /, /article/[slug], /category/[c]    → Prisma (DB-backed, ISR)
├── Admin CMS:     /admin/*                              → NextAuth (Google) + RBAC
├── Contributor:   /contribute/*, /profile, /investigate → NextAuth (Credentials + Google)
└── API:           58 route handlers

     │ Prisma
     ▼
PostgreSQL (Supabase + pgvector)
     │
     ▼ Bearer token
FastAPI (Render) — python-service/
└── Scraper · AI pipeline · APScheduler
```

---

## 2. What Changed (Phase 0 → Phase 3)

### Phase 0 — Quick wins
| Fix | Commit |
|-----|--------|
| Fail-closed admin allowlist [SEC-03] | `d744b79` |
| Cron schedule → every minute [BUG-07] | `f926adf` |
| CSP + security headers [SEC-04] | `7e231ec` |
| Untrack `python-service/.env` [SEC-07] | `34449fb` |
| Remove `x-admin-role`/`x-admin-id` response headers | `a642492` |
| Escape `<` in JSON-LD output [SEC-11] | `ff3ee6c` |
| Fix embeddings `excludeId` raw SQL [BUG-08] | `450898d` |

### Phase 1 — Launch blockers
| Fix | Commit |
|-----|--------|
| Connect public site to DB [BUG-01 / SEC-01] | `56b9cea` |
| Replace admin mock data with real queries [BUG-02] | `c1f2397` |
| Remove 2FA stub (feature + schema fields) [SEC-02 / BUG-04] | `521f759` |
| Fix contributor Google sign-in (auto-create PublicUser) [BUG-09] | `8893fa6` |
| Durable rate limiting via Upstash Redis [BUG-06 / BUG-20] | `7cf53ba` |
| Password reset + email verification (Resend) [BUG-10] | `f0a8497` |
| Prisma migration baseline [BUG-14] | `9a9c8ef` |

### Phase 2 — Post-stabilization
| Fix | Commit |
|-----|--------|
| FK indexes on 9 relations [BUG-13] | `b2d33f0` |
| publishLogs append instead of overwrite [BUG-12] | `b2d33f0` |
| Over-fetch trimmed on `GET /api/contribute/[id]` [BUG-16] | `b2d33f0` |
| Stale-session re-validation for sensitive actions [BUG-11] | `b2d33f0` |
| Python auth consolidation + lifespan + SSRF hardening [BUG-15 / SEC-08 / SEC-09] | `0ffc098` |
| publishLogs append test [BUG-12] | `e3616cc` |
| Consolidate ContributionStatus → WorkflowStage [BUG-17a] | `1854364` |
| Remove dead root Next.js app [BUG-17b] | `488b996` |

### Phase 3 — Tests, CI, Ops
| Fix | Commit |
|-----|--------|
| Workflow transition tests (20 tests) | `428b2ee` |
| Public read integration tests (9 tests) | `428b2ee` |
| CI: coverage + Codecov + Python lint gates | `26ad58a` |

---

## 3. Security Checklist

- ✅ Fail-closed admin allowlist (returns `false` when `ADMIN_EMAILS` empty)
- ✅ Durable rate limiting (Upstash Redis, per-role tiers: admin 200/min, contributor 30/min, default 60/min)
- ✅ JWT TTL: admin 8h, contributor 24h; suspension re-validated against DB on sensitive actions
- ✅ Password hashing (bcrypt cost 12); email verification via Resend
- ✅ SSRF protection in scraper (no internal IPs, 10s timeout, 10MB size cap)
- ✅ CSP + security headers (HSTS, X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy)
- ✅ CORS: same-origin for API routes (Next.js default)
- ✅ No API secrets in frontend bundles (`NEXT_PUBLIC_` only for non-sensitive config)
- ✅ `python-service/.env` untracked from git
- ✅ 2FA stub removed (was misleading dead code)
- ✅ JSON-LD `<` escaped in `dangerouslySetInnerHTML`
- ✅ Misleading `x-admin-role`/`x-admin-id` response headers removed

---

## 4. Database

### Migration order (apply in sequence)
```
prisma/migrations/
  20260528181432_phase_d/
  20260530082710_add_threads_and_video_template/
  20260530090000_add_vector_search/
  20260601000000_remove_2fa_stub/
  20260601000001_article_public_fields/
  20260601000002_password_reset_tokens/
  20260601000003_fk_indexes/
  20260601000004_consolidate_contribution_enums/
```

Run: `npx prisma migrate deploy`

### Key indexes
- **Article**: `(status, publishedAt)`, `(status)`, `(scheduledAt)`, `(slug)`
- **Contribution**: `(workflowStage, createdAt)`, `(workflowStage)`, `(authorId)`, `(type)`, `(publishedAt)`
- **FK indexes**: Evidence.submittedById, FactCheck.checkerId, CommunityVote.userId, EditorialDecision.editorId, Correction.correctedById, MediaAsset.folderId, SocialPost.articleId, AnalyticsEvent.articleId, ReviewComment.articleId

### pgvector
Extension `vector` must be enabled on the Supabase instance before migrating. Verify with:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 5. Environment Variables (required for production)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase Postgres connection string (use pooler URL for Vercel) |
| `DIRECT_URL` | Direct Supabase URL for migrations (`prisma.config.ts`) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis endpoint for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |
| `RESEND_API_KEY` | Transactional email (password reset, email verification) |
| `INTERNAL_SERVICE_TOKEN` | Shared bearer token for Python ↔ Node auth |
| `NEXTAUTH_SECRET` | Session JWT signing key (admin auth) |
| `CONTRIBUTOR_NEXTAUTH_SECRET` | Session JWT signing key (contributor auth) |
| `NEXTAUTH_URL` | Public URL of the Next.js app |
| `GOOGLE_CLIENT_ID` | Google OAuth (admin sign-in) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (admin sign-in) |
| `CONTRIBUTOR_GOOGLE_CLIENT_ID` | Google OAuth (contributor sign-in) |
| `CONTRIBUTOR_GOOGLE_CLIENT_SECRET` | Google OAuth (contributor sign-in) |
| `GEMINI_API_KEY` | AI content pipeline |
| `ADMIN_EMAILS` | Comma-separated admin email allowlist (empty = all denied) |
| `ADMIN_SUPER_ADMINS` | Super admin emails (subset of ADMIN_EMAILS) |
| `CRON_SECRET` | Bearer token protecting the cron endpoint |
| `SENTRY_DSN` | Error tracking |

See `taketoday-app/.env.example` for full list.

---

## 6. Deployment

### Frontend (Vercel)
1. Link repo to Vercel project.
2. Set all env vars in Vercel dashboard (Production + Preview environments).
3. Vercel reads `vercel.json` → cron at `* * * * *` (every minute).
4. `npm run build` runs `prisma generate` automatically (postinstall).
5. Run `npx prisma migrate deploy` in a one-off script or CI step before first deploy.

### Backend (Python — Render or similar)
1. Set `DATABASE_URL` and `INTERNAL_SERVICE_TOKEN` env vars.
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
3. Python 3.11+; install via `pip install -r requirements.txt`.

### Database (Supabase)
1. Enable pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Run migrations: `npx prisma migrate deploy`
3. Enable connection pooling (Transaction mode) for Vercel serverless.

---

## 7. Known Limitations

| Item | Risk | Mitigation |
|------|------|-----------|
| Python job queue is in-memory | Jobs lost on restart; single instance only | Use Celery + Redis for production workloads |
| `next-auth` v5 beta (`^5.0.0-beta.31`) | API may change before stable | Pin to exact version; monitor v5 stable release |
| APScheduler on single FastAPI instance | Cron jobs won't run if Python service restarts | Add health checks + auto-restart on Render |
| Admin role changes require redeploy | `ADMIN_EMAILS` is read from env at startup | Acceptable for current team size; add DB-backed roles later |

---

## 8. Monitoring & Alerts

- **Sentry**: configured for client, server, and edge (DSN in env). Set up alerts for new issues.
- **Upstash Redis**: dashboard shows rate limit hit rates — watch for 429 spikes under load.
- **Supabase**: enable slow-query logging (>1s) in the Supabase dashboard.
- **Vercel**: function logs + runtime errors visible in Vercel dashboard.

---

## 9. Backup & Disaster Recovery

- **Supabase**: automated daily backups included on Pro plan. Point-in-time recovery (PITR) available.
- **Verify restore quarterly**: spin up a staging DB from latest backup and run migrations.
- **RTO**: ~15 min (restore Postgres + redeploy app).
- **RPO**: ~24h (latest daily backup). Reduce with PITR enabled.

---

## 10. Test Coverage

| Suite | Tests | File |
|-------|-------|------|
| RBAC (SEC-03 regression) | 10 | `tests/unit/lib/rbac.test.ts` |
| Contribution workflow transitions | 20 | `tests/unit/lib/contribution-workflow.test.ts` |
| Cron publish (BUG-12 append) | 8 | `tests/unit/api/cron-publish.test.ts` |
| Embeddings SQL (BUG-08) | 4 | `tests/unit/lib/embeddings.test.ts` |
| Auth callbacks / Google sign-in (BUG-09) | 5 | `tests/unit/lib/contributor-auth.test.ts` |
| Public read endpoint (integration) | 9 | `tests/integration/public-read.test.ts` |
| Content queries | 10 | `tests/unit/lib/content-queries.test.ts` |
| Password reset | 8 | `tests/unit/lib/password-reset.test.ts` |
| Admin health + approvals | 12 | `tests/unit/api/` |
| Utilities (semaphore, retry) | 12 | `tests/unit/lib/` |
| **Total** | **98** | |

Run: `npm test` / `npm run test:coverage`

---

## 11. Launch Checklist

### Before first deploy
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run lint` → 0 errors
- [ ] `npm test` → all 98 tests pass
- [ ] `npm run build` → succeeds
- [ ] All env vars set in Vercel dashboard (Production)
- [ ] All env vars set in Render/Python host
- [ ] `CREATE EXTENSION IF NOT EXISTS vector` run on production DB
- [ ] `npx prisma migrate deploy` run against production DB
- [ ] Sentry project created + `SENTRY_DSN` configured
- [ ] Upstash Redis instance created + URL/token in env
- [ ] Resend domain verified + `RESEND_API_KEY` in env
- [ ] `ADMIN_EMAILS` set (at least one super-admin email)
- [ ] `CRON_SECRET` set in Vercel env
- [ ] `INTERNAL_SERVICE_TOKEN` set on both Vercel and Python host
- [ ] Smoke test: publish an article → appears at `/article/[slug]`
- [ ] Smoke test: contributor registers → receives verification email
- [ ] Smoke test: password reset email delivered

### Post-launch monitoring (first 48h)
- [ ] Check Sentry for new error groups
- [ ] Verify cron fires every minute (check Vercel cron logs)
- [ ] Confirm Upstash rate limit dashboard shows hits but no runaway 429s
- [ ] Supabase query insights — confirm no slow queries >500ms

---

## 12. Remaining Risks (not fixed in this sprint)

| Risk | Severity | Notes |
|------|----------|-------|
| Python job queue durability | Medium | Replace with Celery + Redis before significant traffic |
| `next-auth` v5 beta | Low | Monitor for stable release; pin exact version |
| Admin role changes need redeploy | Low | Acceptable for small teams |
| No E2E (Playwright) tests | Low | Add before v1.0 public launch |
| Bundle analysis not run | Low | Run `ANALYZE=true npm run build` and code-split TipTap editor off public routes |
| `lucide-react` minor version behind | Low | `^1.16.0` installed, `1.17.0` available — update next dep cycle |
