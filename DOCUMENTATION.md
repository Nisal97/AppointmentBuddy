# Appointment Buddy — Technical Documentation

> Comprehensive architectural and feature reference for the Appointment Buddy
> appointment scheduling platform.

---

## Table of Contents

1. [Feature Summary](#feature-summary)
2. [Architecture & Performance](#architecture--performance)
3. [Data Model](#data-model)
4. [Testing & CI/CD](#testing--cicd)
5. [Local Development](#local-development)
6. [Security & Access Control](#security--access-control)

---

## 1. Feature Summary

### Interactive Daily Schedule Timeline

The new-appointment flow (`/appointments/new`) is built around an interactive
daily scheduling experience. Providers pick a date, a start time, and one or
more services; the system computes the total estimated duration and price from
the selected services and renders the proposed appointment block against the
day's existing bookings.

### 5-Minute Interval Slot Picker

The time input (`<input type="time" step={300}>`) restricts choices to
5-minute increments (300 seconds), matching the granularity at which most
service businesses operate. Combined with the service-duration sum, this makes
it quick to snap to valid slots while still allowing fine-grained adjustments.

### Mobile-Optimized UI (≥ 44 px Touch Targets)

The UI is mobile-first and PWA-ready, installable from the browser on phones
and tablets. All interactive elements — date/time inputs, service checkboxes,
staff select, and the submit button — use padded, touch-friendly layouts
designed to meet or exceed the 44 × 44 dp minimum touch-target guideline so
receptionists can book appointments quickly on handheld devices.

### Real-Time Overlap Conflict Detection

When a provider picks a date, time, staff member, and services, the client
reactively calls the server `checkAppointmentConflict` action. Overlap is
determined with the half-open interval rule:

```
conflict ⇔ newStart < existingEnd  &&  newEnd > existingStart
```

- `newStart` / `newEnd` are derived from the chosen time + total duration.
- `existingStart` / `existingEnd` come from each non-completed appointment on
  the same date for the same staff member.
- Adjacent (back-to-back) appointments — where `newEnd === existingStart` —
  are **not** treated as conflicts.

If a conflict is found, an amber warning banner (`role="alert"`) names the
conflicting appointment, the submit button is disabled, and a "Find available
staff" resolution dropdown appears listing staff who have zero overlapping
appointments in the window.

### Staff Reassignment Workflow

From the conflict banner the provider can:

1. Open the "Find available staff" `<select>`, populated only with staff who
   are free during the requested window.
2. Click "Assign to <Staff>" to switch the selected assignee.
3. Watch the conflict banner disappear and the submit button re-enable.
4. Submit the appointment, which runs a server-side backstop conflict check
   before inserting the row.

This keeps double-booking impossible at both the UI and database-action layers.

---


## 2. Architecture & Performance

### Framework & Runtime

- **Next.js 16** (App Router), React 19, TypeScript 5 strict mode.
- **Turbopack** for dev and builds (`next dev`, `next build`), with the
  `@tailwindcss/turbopack` loader for CSS.
- **Server Components** by default; the new-appointment page opts out of
  static prerendering with `await connection()` so `supabase.auth.getUser()`
  resolves per-request, wrapped in a `<Suspense>` boundary.

### Supabase Backend

- **PostgreSQL** database: `profiles`, `services`, `assignees`,
  `appointments`, `appointment_services`.
- **Supabase Auth** for shop-owner accounts (email/password, email confirmation
  on signup).
- **Row Level Security (RLS)**: each table enforces `auth.uid() = shop_id` so
  owners can only touch their own shop's data.
- Database trigger `handle_new_user` auto-creates a profile row on signup.

### Vercel Serverless Function Region Alignment

Next.js API/serverless functions are deployed to Vercel's edge network. To
minimize latency between the frontend, server functions, and the Supabase
Postgres instance, the Vercel project region should be aligned (co-located) as
closely as possible to the Supabase project's hosting region. Cross-region
round trips add noticeable latency to every auth check and appointment query.

### Query Parallelization (`Promise.all`)

Where multiple independent Supabase reads are needed on the same page (for
example fetching `services` and `assignees` for a shop), the code issues them
concurrently rather than sequentially:

```ts
const [servicesResult, assigneesResult] = await Promise.all([
  supabase.from("services").select(...).eq("shop_id", user.id),
  supabase.from("assignees").select(...).eq("shop_id", user.id),
]);
```

This reduces total data-fetch waterfall time to that of the slowest single
query instead of their sum.

### Auth Deduplication with React `cache()`

Server Component auth lookups are wrapped in React's `cache()` so that, within
a single render pass, repeated calls to `supabase.auth.getUser()` resolve to
the same in-memory result instead of hitting Supabase multiple times. This
deduplicative memoization keeps per-request auth overhead flat as component
trees grow.

---

## 3. Data Model

| Table            | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `profiles`       | One row per auth user; shop name, owner, contact info.   |
| `services`       | Offered services with duration, cost, gender pricing.    |
| `assignees`      | Staff members (`name`, `available_today`).               |
| `appointments`   | Bookings: customer, date/time, duration, cost, staff, status. |
| `appointment_services` | Junction linking appointments to selected services. |

Key conflict-detection fields on `appointments`:
- `appointment_date` (YYYY-MM-DD)
- `appointment_time` (HH:MM)
- `total_duration_minutes`
- `assignee_id`
- `status` (`upcoming | ongoing | completed`)

Only non-`completed` appointments participate in overlap checks.

---

## 4. Testing & CI/CD

### Unit Tests (Vitest)

Location: `unit-tests/` — run with `npm run test:unit` (Vitest v5, Node
environment, typechecking enabled).

Covered suites:
- `appointment-conflict.test.ts` — `checkAppointmentConflict` server action:
  auth gating, invalid input, overlap flagging, back-to-back non-conflict,
  exclude-appointment editing, available-staff listing.
- `appointment-create.test.ts` — `createAppointment` action: validation,
  service/assignee resolution, conflict backstop, insert + link, rollback.
- `appointment-complete.test.ts` / `appointment-delete-completed.test.ts` /
  `appointment-edit-ongoing.test.ts` — mutation actions (complete, delete,
  update).
- `conflict-math.test.ts` — pure overlap math and availability filtering
  (`hasConflict`, `getAvailableStaff` from `src/lib/conflict.ts`):
  exact, partial-start, partial-end, and enclosed overlap; adjacent boundaries
  return no conflict; staff filtering returns only overlap-free staff.

### End-to-End Tests (Playwright)

Location: `e2e/` — run with `npx playwright test` against `http://localhost:3000`.

Covered flows:
- `seed-data.spec.ts` — idempotent Supabase seeding of test shops/services/assignees.
- `cleanup-data.spec.ts` — FK-safe teardown of test-shop data.
- `user-registration.spec.ts` — signup flow.
- `appointment-conflict.spec.ts` — navigate to `/appointments/new`, pick a
  date / 10:00 AM / 60-minute service / Staff A (booked at 10:30 AM), assert
  the conflict banner appears and submit is disabled, select free Staff B from
  the resolution dropdown, assert the banner clears and submit succeeds.

### CI/CD Pipeline (GitHub Actions)

`.github/workflows/deploy.yml` runs on push/PR to `main`:

1. **Unit Tests (Vitest)** — `ubuntu-latest`, Node 22, `npm ci`, `npm run
   test:unit`.
2. **Check & Build** — `npm ci`, `npx tsc --noEmit` typecheck, install
   Playwright Chromium, verify Supabase env presence (warns if missing),
   conditionally run Playwright E2E, then `npm run build`.
3. **Deploy to Vercel** — needs `unit-tests` and `check-and-build`; only on
   `main` pushes; uses the `amondnet/vercel-action` with
   `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` secrets; skipped if
   those secrets are absent.

E2E tests require repository Secrets/Vars:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
(or `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and `SUPABASE_SERVICE_ROLE_KEY`. If any
are missing, E2E is skipped gracefully while unit tests, typecheck, and build
still run.

---

## 5. Local Development

See `README.md` → **Getting Started** for install and env setup. After `npm
run dev`, open `http://localhost:3000`. The new-appointment page is at
`/appointments/new`.

---

## 6. Security & Access Control

- All data access is gated behind Supabase Auth (`supabase.auth.getUser()`).
- RLS policies restrict profiles, services, assignees, and appointments to the
  authenticated owner's shop (`auth.uid() = shop_id`).
- The server action re-resolves services server-side so duration/price cannot
  be forged from the client.
- A server-side conflict backstop in `createAppointment` prevents double
  booking even if the UI check is bypassed.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and used solely by E2E seed/
  cleanup scripts; it is never exposed to the browser.

---


