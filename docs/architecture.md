# Architecture

## Request flow

Route Handlers are the HTTP boundary: they parse input, authenticate and authorize requests, and construct API responses. Zod validates external input, services own consultation rules, and repositories perform persistence through Supabase.

The API response helpers and exported response-code constants are defined in `src/lib/http/responses.ts`. This keeps response shapes, codes, and allowed HTTP statuses aligned in TypeScript.

## Supabase authentication

`@supabase/ssr` maintains the browser and server session. The Next.js Proxy refreshes session cookies and redirects users to the appropriate route using the trusted role claim.

Proxy redirects and conditional UI are navigation aids, not authorization boundaries. API Route Handlers authenticate requests with `auth.getUser()` and perform application-level role checks. PostgreSQL RLS independently restricts database access by row ownership and admin read access.

The trusted role claim is `app_metadata.role`. It must be assigned through a trusted Supabase mechanism, not through registration or editable user metadata.

## Row-level security

Consultation RLS is independent of the API:

- authenticated users can read their own consultations
- admins can read all consultations when `(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`
- users can insert rows only with `user_id = auth.uid()`
- users can update only their own rows
- admins have read-only access to consultations

The application uses the public Supabase publishable key, so authenticated clients can also call the Supabase Data API directly. RLS protects row ownership on those direct requests, but the current update grant and policy do not enforce which fields a user may change or the service's state-transition and future-scheduling rules. Those business rules currently run in the Route Handler/service path and can be bypassed through direct Data API updates. Enforce sensitive mutation rules in the database or restrict update privileges before relying on them as a security boundary.

## State transitions

Allowed application-level transitions are centralized in `src/services/consultation.transitions.ts` and applied by `src/services/consultation.service.ts`. The database column is an enum, but it does not enforce those transitions or the future-time rule. State checks are performed in the service before updates and are not atomic with the database update, so concurrent updates can race.

## Current scope and growth

The only persisted business domain is consultations. The current structure provides a pattern for adding domains, but does not yet model courses, enrollments, teaching staff, learning content, assignments, submissions, or grades. Consultation list queries are also currently unpaginated; add pagination and appropriate query limits before using them with large datasets.
