/**
 * @fileoverview e2e/cleanup-data.spec.ts — Deletes test shop data from Supabase after E2E tests.
 *
 * PURPOSE
 *   Removes all appointments, services, assignees, shop profiles, and auth users
 *   belonging exclusively to the three test shop emails. Designed to run after E2E
 *   tests so the database is left clean for the next run.
 *
 * TECHNOLOGY
 *   Playwright Test (https://playwright.dev) + Supabase JS client (@supabase/supabase-js).
 *   Runs in Node.js (no browser page needed — pure database cleanup).
 *
 * SAFETY GUARANTEES
 *   All DELETE operations are scoped strictly to the three test shop profile IDs
 *   (resolved from auth.users via email). Production or non-test data can never be
 *   touched, even if the service-role key bypasses RLS.
 *
 * DELETE ORDER (FK-safe)
 *   1. appointment_services (junction rows referencing appointments)
 *   2. appointments
 *   3. services
 *   4. assignees
 *   5. profiles (shop records)
 *   6. auth.users (so test emails can be re-seeded later)
 *
 * ENVIRONMENT VARIABLES (required)
 *   NEXT_PUBLIC_SUPABASE_URL  — your Supabase project URL (also read as SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY — service role secret from Supabase Settings → API
 *
 * HOW TO RUN
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"
 *   npx playwright test e2e/cleanup-data.spec.ts
 *
 * TEST SHOPS CLEANED
 *   test.barber@nmhub.sl
 *   test.salon@nmhub.sl
 *   test.autocare@nmhub.sl
 */

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ---------------------------------------------------------------------------
// Validate required environment variables before creating the Supabase client.
// Playwright does not auto-load `.env.local` (only `.env`), and the service
// role key is a CI/local secret that must be provided explicitly.
// ---------------------------------------------------------------------------
if (!SUPABASE_URL) {
  throw new Error(
    "Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL. Set it in your shell or a `.env` file before running e2e tests.",
  );
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Set it in your shell before running e2e tests.",
  );
}

/** Emails that identify the three test shops (email lives in auth.users). */
const TEST_SHOP_EMAILS = [
  "test.barber@nmhub.sl",
  "test.salon@nmhub.sl",
  "test.autocare@nmhub.sl",
] as const;

test.describe("cleanup test shop data", () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  });

  test(
    "deletes appointments, services, assignees, shops, and auth users for test shop emails only",
    async () => {
      // Email lives in auth.users, while profiles (shops) reference
      // auth.users.id, so we resolve the test shop profile ids via auth.
      const { data: listedUsers } = await supabase.auth.admin.listUsers();
      const testUserIds = (listedUsers?.users ?? [])
        .filter((u) =>
          u.email &&
          TEST_SHOP_EMAILS.includes(u.email as typeof TEST_SHOP_EMAILS[number]),
        )
        .map((u) => u.id!);

      if (testUserIds.length === 0) {
        console.log("[cleanup] No test shop users found. Nothing to delete.");
        return;
      }

      // Delete in FK-safe order. The service-role key bypasses RLS, and the
      // WHERE clauses are restricted to the three test shop emails/ids, so
      // production or non-test data can never be touched.
      //
      // 1. Junction rows first (appointment_services references appointments).
      const { data: appointments } = await supabase
        .from("appointments")
        .select("id")
        .in("shop_id", testUserIds);
      const appointmentIds = ((appointments ?? []) as { id: string }[]).map(
        (a) => a.id,
      );

      if (appointmentIds.length > 0) {
        await supabase
          .from("appointment_services")
          .delete()
          .in("appointment_id", appointmentIds);
      }

      // 2. Appointments.
      await supabase.from("appointments").delete().in("shop_id", testUserIds);
      // 3. Services.
      await supabase.from("services").delete().in("shop_id", testUserIds);
      // 4. Assignees.
      await supabase.from("assignees").delete().in("shop_id", testUserIds);
      // 5. Shop profiles.
      await supabase.from("profiles").delete().in("id", testUserIds);

      // 6. Auth users so the test emails can be re-seeded later.
      for (const userId of testUserIds) {
        await supabase.auth.admin.deleteUser(userId);
      }

      // Verify no test-shop data remains.
      const { data: remainingUsers } = await supabase.auth.admin.listUsers();
      const remainingTestEmails = (remainingUsers?.users ?? [])
        .filter((u) =>
          u.email &&
          TEST_SHOP_EMAILS.includes(
            u.email as typeof TEST_SHOP_EMAILS[number],
          ),
        )
        .map((u) => u.email);
      expect(remainingTestEmails).toEqual([]);
    },
  );
});
