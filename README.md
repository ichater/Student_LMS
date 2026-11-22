# Contour Mini-LMS

A small Learning Management System for students and administrators, built with Next.js App Router, Supabase, PostgreSQL, and TypeScript.

## Setup

Requirements:

- Node.js 20.9 or newer
- Docker Desktop for local Supabase

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

For local Supabase:

```bash
npm run supabase:start
npm run supabase:reset
npm run supabase:status
npm run supabase:stop
```

Assign or verify an admin locally:

```bash
npm run admin:set -- -Email user@example.com -Role admin
npm run admin:set -- -Email user@example.com -Role student
```

This is a trusted database workflow and must remain outside browser code. See [Setup](docs/setup.md) for hosted instructions and verification.

Open http://localhost:3000.

## API Documentation

With the Next.js development server running, visit http://localhost:3000/api-docs for the local Swagger UI. The Swagger UI loads the maintained OpenAPI specification at http://localhost:3000/openapi.yaml.

## Main Commands

- `npm run dev` - start Next.js
- `npm run lint` - run ESLint
- `npm test` - run Vitest unit and Route Handler tests
- `npm run test:integration` - run API Route Handler tests (mocked; no Supabase connection)
- `npm run test:e2e` - run Playwright browser tests
- `npm run build` - create a production build
- `npm run supabase:start` - start local Supabase
- `npm run supabase:reset` - reset and apply migrations
- `npm run verify:rls` - verify selected RLS behaviors against local Supabase; leaves a test row in the database

## Application Pages

- `/dashboard` - authenticated student consultation list, booking form, rescheduling, completion, incompletion, and cancellation
- `/admin/consultations` - authenticated, read-only system-wide consultation view for administrators
- `/login` and `/register` - authentication entry points

## Technical Overview

- Next.js Proxy redirects users as a navigation aid; Route Handlers authorize application requests and RLS enforces row-level data access.
- Next.js Route Handlers are the application HTTP boundary.
- Services contain business rules and repositories perform database access.
- Zod validates externally supplied request data.
- Supabase Auth identifies users and provides JWT claims.
- PostgreSQL RLS enforces row ownership and admin read access independently of API authorization.
- Consultation status transitions and scheduling rules currently live in the application service, not in database triggers or RLS.
- Because authenticated users can call the Supabase Data API directly, current RLS does not prevent bypassing those application-level mutation rules; see [Architecture](docs/architecture.md).
- The trusted admin role is read from `app_metadata.role`, never editable user metadata.
- Consultation cancellation is represented by status; records are not deleted.

See [Architecture](docs/architecture.md), [Setup](docs/setup.md), and [OpenAPI](openapi.yaml).

This is a consultation-focused LMS starter, not a complete course, assessment, or content-management platform. See [Architecture](docs/architecture.md) for current boundaries and limitations.

## Browser tests

Run `npm run test:e2e:install` once, then `npm run test:e2e`. The local suite supports `E2E_STUDENT_EMAIL` / `E2E_STUDENT_PASSWORD` and `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` after assigning the trusted account claims. See [Setup](docs/setup.md#browser-verification).
