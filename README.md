# 📅 Appointment Buddy

Appointment Buddy is a lightweight, real-time appointment and queue management system tailored for local service providers like barbershops, salons, and private family doctors. Built as a Progressive Web App (PWA), it delivers a seamless, native-like experience across desktop reception terminals and mobile devices.

## ✨ Core Features

* **Interactive daily schedule timeline** — pick a date, start time, and services; the system computes total duration and price and renders the proposed block against the day's bookings.
* **5-minute interval slot picker** — the time input snaps to 5-minute increments (`step={300}`) for fast, granular booking.
* **Mobile-optimized UI (≥ 44 px touch targets)** — PWA-installable, touch-friendly inputs, checkboxes, staff select, and submit button.
* **Real-time overlap conflict detection** — half-open interval rule (`newStart < existingEnd && newEnd > existingStart`); adjacent back-to-back appointments are not conflicts. A warning banner names the clash and disables submit.
* **Staff reassignment workflow** — pick a conflict-free staff member from the "Find available staff" dropdown; the banner clears and submit re-enables.
* **Real-time queue tracking** — move appointments through status stages (Upcoming → Ongoing → Completed) with live UI updates across all logged-in devices.
* **Smart entry generation** — customizable service menus with time estimates and pricing.
* **Staff & profile management** — secure credentials and multi-staff assignment.

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) 16 (App Router), React 19, TypeScript 5
* **Backend & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Row Level Security)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4 (Turbopack)
* **Testing:** [Vitest](https://vitest.dev/) (unit), [Playwright](https://playwright.dev/) (E2E)
* **Runtime/Build:** Turbopack, Node 22

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn
* A Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Nisal97/AppointmentBuddy.git
   cd appointment-buddy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret   # server-only; used by E2E seed/cleanup
   ```
   `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and must never be exposed to the browser.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). The new-appointment page is at `/appointments/new`.

## 🧪 Testing

### Unit tests (Vitest)

```bash
npm run test          # or: npm run test:unit
npm run test:unit:watch
```

### End-to-end tests (Playwright)

E2E tests require the Supabase env vars above (including `SUPABASE_SERVICE_ROLE_KEY`) and a running dev server:

```bash
# In one terminal
npm run dev

# In another terminal
npx playwright test
```

Individual suites:
```bash
npx playwright test e2e/seed-data.spec.ts
npx playwright test e2e/appointment-conflict.spec.ts
npx playwright test e2e/cleanup-data.spec.ts
```

## 🔁 CI/CD Pipeline

GitHub Actions (`.github/workflows/deploy.yml`) runs on push/PR to `main`:

1. **Unit Tests (Vitest)** — Node 22, `npm ci`, `npm run test`.
2. **Check & Build** — `npm ci`, `npx tsc --noEmit` typecheck, install Playwright Chromium, verify Supabase env presence, conditionally run Playwright E2E, then `npm run build`.
3. **Deploy to Vercel** — needs unit tests + check & build; only on `main` pushes; uses `amondnet/vercel-action` with `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets (skipped if absent).

E2E tests require repository Secrets/Vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and `SUPABASE_SERVICE_ROLE_KEY`. If missing, E2E is skipped while unit tests, typecheck, and build still run.

## 🗄️ Database Schema

* `profiles` — shop owner details and settings.
* `services` — available services, estimated times, and prices.
* `assignees` — staff members of the shop.
* `appointments` — customer details, linked service, assigned staff, scheduled time, and status.
* `appointment_services` — junction linking appointments to services.

## 📚 Detailed Documentation

See [`DOCUMENTATION.md`](DOCUMENTATION.md) for the full architectural and feature reference (conflict math, staff availability filtering, serverless region alignment, query parallelization, auth deduplication, testing, CI/CD).