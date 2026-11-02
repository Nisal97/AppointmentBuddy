/**
 * @fileoverview e2e/appointment-conflict.spec.ts — End-to-end tests for
 * appointment conflict detection and staff reassignment on /appointments/new.
 *
 * FLOW UNDER TEST
 *   1. Sign in as a shop owner.
 *   2. Open /appointments/new and pick a date, 10:00 AM, a 60-minute service
 *      and Staff A (who already has a 10:30 AM appointment that day).
 *   3. Assert the conflict warning banner appears and the submit button is
 *      disabled.
 *   4. Pick the free Staff B from the "Find available staff" resolution
 *      dropdown and click "Assign to Staff B".
 *   5. Assert the conflict banner disappears and the submit button is enabled,
 *      then submit the form successfully.
 *
 * SETUP (runs in test.beforeAll, Node context, no browser)
 *   Uses the Supabase service-role key to create/find a confirmed shop owner
 *   account, seed Staff A / Staff B, a 60-minute service, and a conflicting
 *   10:30 AM appointment for Staff A. Data is idempotent across re-runs.
 *
 * ENVIRONMENT VARIABLES (required)
 *   NEXT_PUBLIC_SUPABASE_URL  (also read as SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * HOW TO RUN
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"
 *   npx playwright test e2e/appointment-conflict.spec.ts
 */

import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

const TEST_EMAIL = "conflict.test@nmhub.sl";
const TEST_PASSWORD = "ConflictTest123!";
const SHOP_NAME = "Conflict Test Shop";
const SERVICE_NAME = "60-min Service";
const STAFF_A_NAME = "Staff A";
const STAFF_B_NAME = "Staff B";

let supabase: SupabaseClient;
let shopId: string;
let staffAId: string;
let staffBId: string;
let serviceId: string;
let testDate: string;

test.describe("appointment conflict detection and staff reassignment", () => {
  test.beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    testDate = new Date().toISOString().slice(0, 10);

    // ------------------------------------------------------------------
    // 1. Ensure a confirmed shop owner account exists (idempotent).
    // ------------------------------------------------------------------
    let { data: listed } = await supabase.auth.admin.listUsers();
    let user = (listed?.users ?? []).find((u) => u.email === TEST_EMAIL);
    if (!user) {
      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          email_confirm: true,
          user_metadata: {
            shop_name: SHOP_NAME,
            owner_name: "Conflict Owner",
            contact_info: "+1555000000",
          },
        });
      expect(createError).toBeNull();
      user = created!.user!;
    }
    shopId = user!.id;

    // ------------------------------------------------------------------
    // 2. Self-heal the profile row.
    // ------------------------------------------------------------------
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: shopId,
          shop_name: SHOP_NAME,
          owner_name: "Conflict Owner",
          contact_info: "+1555000000",
        },
        { onConflict: "id" },
      );
    expect(profileError).toBeNull();

    // ------------------------------------------------------------------
    // 3. Ensure a 60-minute service exists for the shop.
    // ------------------------------------------------------------------
    const { data: existingService } = await supabase
      .from("services")
      .select("id")
      .eq("shop_id", shopId)
      .eq("name", SERVICE_NAME)
      .maybeSingle();
    if (existingService) {
      serviceId = existingService.id as string;
      await supabase
        .from("services")
        .update({ duration_minutes: 60 })
        .eq("id", serviceId);
    } else {
      const { data: svc, error: serr } = await supabase
        .from("services")
        .insert({
          shop_id: shopId,
          name: SERVICE_NAME,
          duration_minutes: 60,
          cost: 3000,
        })
        .select("id")
        .single();
      expect(serr).toBeNull();
      serviceId = svc!.id as string;
    }

    // ------------------------------------------------------------------
    // 4. Ensure Staff A and Staff B exist (dedupe by name + shop).
    // ------------------------------------------------------------------
    for (const name of [STAFF_A_NAME, STAFF_B_NAME]) {
      const { data: existing } = await supabase
        .from("assignees")
        .select("id")
        .eq("shop_id", shopId)
        .eq("name", name)
        .maybeSingle();
      if (existing) {
        if (name === STAFF_A_NAME) staffAId = existing.id as string;
        else staffBId = existing.id as string;
      } else {
        const { data: inserted, error: ierr } = await supabase
          .from("assignees")
          .insert({
            shop_id: shopId,
            name,
            available_today: true,
          })
          .select("id")
          .single();
        expect(ierr).toBeNull();
        if (name === STAFF_A_NAME) staffAId = inserted!.id as string;
        else staffBId = inserted!.id as string;
      }
    }

    // ------------------------------------------------------------------
    // 5. Seed a conflicting appointment for Staff A at 10:30 on testDate
    //    (idempotent: skip if already present).
    // ------------------------------------------------------------------
    const { data: existingAppt } = await supabase
      .from("appointments")
      .select("id")
      .eq("shop_id", shopId)
      .eq("assignee_id", staffAId)
      .eq("appointment_date", testDate)
      .eq("appointment_time", "10:30")
      .maybeSingle();
    if (!existingAppt) {
      const { error: ierr } = await supabase.from("appointments").insert({
        shop_id: shopId,
        customer_name: "Existing Client",
        contact_number: "+1555000001",
        appointment_date: testDate,
        appointment_time: "10:30",
        total_duration_minutes: 30,
        total_cost: 0,
        gender: "male",
        assignee_id: staffAId,
        status: "upcoming",
      });

      expect(ierr).toBeNull();
    }
  });


  test("detects the conflict, allows staff reassignment, then submits", async ({
    page,
  }) => {
    // Sign in as the shop owner so server components can resolve a session.
    await page.goto("/login");
    await page.locator('id=loginEmailInput').fill(TEST_EMAIL);
    await page.locator('id=loginPasswordInput').fill(TEST_PASSWORD);
    await page.click('id=loginSubmitButton');
    await expect(page).toHaveURL("/home");

    await page.goto("/appointments/new");

    const conflictBanner = page.locator('role=alert');
    const submitButton = page.locator('id=newAppointmentCreateButton');

    // Fill the new-appointment form: today, 10:00 AM, 60-minute service,
    // Staff A (booked at 10:30 AM → proposed 10:00-11:00 overlaps).
    await page.locator('id=appointmentDate').fill(testDate);
    await page.locator('id=appointmentTime').fill("10:00");
    await page
      .locator(
        `label#newAppointmentServiceLabel-${serviceId} input[type="checkbox"]`,
      )
      .check();
    await page.locator('id=assigneeId').selectOption(staffAId);

    // Conflict warning banner appears and submit is blocked.
    await expect(conflictBanner).toBeVisible();
    await expect(conflictBanner).toContainText("Scheduling conflict");
    await expect(submitButton).toBeDisabled();

    // Resolution: pick the free Staff B from the dropdown and assign them.
    const availableStaffSelect = page.locator(
      'label:has-text("Find available staff") + select',
    );
    await expect(availableStaffSelect).toBeVisible();
    await availableStaffSelect.selectOption(staffBId);
    await page.getByRole("button", { name: /^Assign to Staff B$/ }).click();

    // Conflict clears and the submit button is unblocked.
    await expect(conflictBanner).toBeHidden();
    await expect(submitButton).toBeEnabled();

    // Submit the appointment successfully.
    await page.locator('id=customerName').fill("New Client");
    await page.locator('id=contactNumber').fill("+1555000002");
    await submitButton.click();
    await expect(page).toHaveURL(/\/home\?created=1/);
  });
});

