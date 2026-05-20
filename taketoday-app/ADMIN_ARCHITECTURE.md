# TakeToday Admin Architecture

## Folder Structure

- `app/admin/*`: App Router admin pages.
- `app/api/admin/*`: admin API route handlers with validation-ready boundaries.
- `components/admin/*`: dashboard shell, module pages, tables, charts, timeline, providers.
- `components/ui/*`: shadcn-style primitives local to this app.
- `lib/admin/*`: RBAC, module registry, API helpers, sample operational data.
- `lib/db/prisma.ts`: Prisma client singleton.
- `prisma/schema.prisma`: PostgreSQL schema for the admin product.
- `prisma/seed.ts`: sample seed data.

## API Architecture

All admin API routes live under `/api/admin/*` and are protected by middleware. Current route surfaces:

- `GET/POST /api/admin/articles`
- `POST /api/admin/ai`
- `POST /api/admin/ingestion`
- `GET /api/admin/media`
- `POST /api/admin/social`
- `GET /api/admin/analytics`
- `GET/POST /api/admin/users`
- `GET /api/admin/notifications`
- `GET /api/admin/settings`

The routes currently use typed mock data where external services are not configured. Swap those reads for Prisma queries once `DATABASE_URL` is set.

## Authentication And RBAC

Auth.js is centralized in `auth.ts` with Google login, JWT sessions, role derivation, and admin allowlist support.

Recommended env vars:

```bash
ADMIN_EMAILS="founder@taketoday.com,editor@taketoday.com"
ADMIN_SUPER_ADMINS="founder@taketoday.com"
ADMIN_EDITORS="editor@taketoday.com"
ADMIN_CONTENT_MANAGERS="content@taketoday.com"
ADMIN_SOCIAL_MANAGERS="social@taketoday.com"
DATABASE_URL="postgresql://..."
CLOUDINARY_URL="cloudinary://..."
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."
```

## Database

The Prisma schema models:

- users, roles, 2FA readiness, session-oriented fields
- articles, workflow status, SEO, scheduling, categories, tags, gallery
- media folders/assets and tags
- ingestion sources/jobs
- social posts and retry metadata
- short video jobs
- review comments
- analytics events
- notifications
- integrations
- audit logs

## Deployment

1. Configure Supabase Postgres and set `DATABASE_URL`.
2. Run `npx prisma generate`.
3. Run `npx prisma migrate deploy`.
4. Optionally seed: `npm run db:seed`.
5. Configure Auth.js Google credentials and admin allowlist env vars.
6. Configure Cloudinary and AI provider keys.
7. Deploy to Vercel with the same env vars.

## Security Notes

- RBAC is centralized in `lib/admin/rbac.ts`.
- API payloads use Zod validation at route boundaries.
- Audit log table is present for all sensitive mutations.
- Middleware protects `/admin/*` and `/api/admin/*`.
- API keys should be stored as provider secret refs, not displayed in the UI.
- Add provider webhooks and rate limiting before enabling write actions against external APIs.
