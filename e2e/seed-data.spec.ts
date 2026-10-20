/**
 * @fileoverview e2e/seed-data.spec.ts — Seeds test shop data into Supabase before running E2E tests.
 *
 * PURPOSE
 *   Creates three test shops (barber, women's salon, vehicle service station) in Supabase
 *   with their services and assignees, so downstream E2E tests have realistic data to work with.
 *
 * TECHNOLOGY
 *   Playwright Test (https://playwright.dev) + Supabase JS client (@supabase/supabase-js).
 *   Runs in Node.js (no browser page needed — pure database seeding).
 *
 * IDEMPOTENCY STRATEGY
 *   Before creating anything, the script queries auth.users for the three test shop emails.
 *   If all emails already exist, creation is skipped entirely. Individual services and
 *   assignees are also deduped by (shop_id, name) so re-running never creates duplicates.
 *
 * ENVIRONMENT VARIABLES (required)
 *   NEXT_PUBLIC_SUPABASE_URL  — your Supabase project URL (also read as SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY — service role secret from Supabase Settings → API
 *                               (bypasses RLS so the script can insert into any shop)
 *
 * HOW TO RUN
 *   $env:NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<service-role-secret>"
 *   npx playwright test e2e/seed-data.spec.ts
 *
 * TEST SHOPS SEEDED
 *   1. Gentlemen's Quarters (barber)   — test.barber@nmhub.sl   — 3 assignees, 5 services
 *   2. Velvet Beauty Lounge (salon)    — test.salon@nmhub.sl    — 5 assignees, 5 services
 *   3. Lanka Auto Care & Wash (auto)   — test.autocare@nmhub.sl  — 5 assignees, 5 services
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

const SEED_PASSWORD = "TestSeed123";

interface ServiceSeed {
  name: string;
  durationMinutes: number;
  cost: number;
  genderSpecific: boolean;
  male?: { durationMinutes: number; cost: number };
  female?: { durationMinutes: number; cost: number };
}

interface ShopSeed {
  email: string;
  shopName: string;
  ownerName: string;
  contactInfo: string;
  services: ServiceSeed[];
  assignees: string[];
}

const SHOPS: ShopSeed[] = [
  {
    // Part 1: Barber Shop
    email: "test.barber@nmhub.sl",
    shopName: "Gentlemen's Quarters",
    ownerName: "Kamal Perera",
    contactInfo: "+94771234567",
    services: [
      { name: "Male Haircut", durationMinutes: 30, cost: 1500, genderSpecific: true, male: { durationMinutes: 30, cost: 1500 } },
      { name: "Female Haircut", durationMinutes: 45, cost: 2000, genderSpecific: true, female: { durationMinutes: 45, cost: 2000 } },
      { name: "Beard Trim", durationMinutes: 20, cost: 800, genderSpecific: true, male: { durationMinutes: 20, cost: 800 } },
      { name: "Head & Shoulder Massage (Male)", durationMinutes: 30, cost: 1200, genderSpecific: true, male: { durationMinutes: 30, cost: 1200 } },
      { name: "Body Massage (Female)", durationMinutes: 60, cost: 2500, genderSpecific: true, female: { durationMinutes: 60, cost: 2500 } },
    ],
    assignees: ["Kamal Perera", "Nimal Silva", "Sahan Fernando"],
  },
  {
    // Part 2: Women's Salon
    email: "test.salon@nmhub.sl",
    shopName: "Velvet Beauty Lounge",
    ownerName: "Anusha Ranasinghe",
    contactInfo: "+94719876543",
    services: [
      { name: "Hair Styling & Blowdry", durationMinutes: 60, cost: 2500, genderSpecific: true, female: { durationMinutes: 60, cost: 2500 } },
      { name: "Facial Treatment", durationMinutes: 45, cost: 3000, genderSpecific: true, female: { durationMinutes: 45, cost: 3000 } },
      { name: "Manicure & Pedicure", durationMinutes: 60, cost: 3500, genderSpecific: true, female: { durationMinutes: 60, cost: 3500 } },
      { name: "Hair Coloring", durationMinutes: 90, cost: 5000, genderSpecific: true, female: { durationMinutes: 90, cost: 5000 } },
      { name: "Threading & Waxing", durationMinutes: 30, cost: 1500, genderSpecific: true, female: { durationMinutes: 30, cost: 1500 } },
    ],
    assignees: [
      "Anusha Ranasinghe",
      "Dilani Wickramasinghe",
      "Kavindi Jayawardena",
      "Maleesha Perera",
      "Sachini De Silva",
    ],
  },
  {
    // Part 3: Vehicle Service Station
    email: "test.autocare@nmhub.sl",
    shopName: "Lanka Auto Care & Wash",
    ownerName: "Kasun Jayasuriya",
    contactInfo: "+94701122334",
    services: [
      { name: "Full Body Wash & Vacuum", durationMinutes: 45, cost: 2000, genderSpecific: false },
      { name: "Engine Oil & Filter Replacement", durationMinutes: 60, cost: 4500, genderSpecific: false },
      { name: "Wheel Alignment & Balancing", durationMinutes: 45, cost: 3500, genderSpecific: false },
      { name: "Interior Detailing", durationMinutes: 90, cost: 6000, genderSpecific: false },
      { name: "Undercarriage Degreasing & Rustproofing", durationMinutes: 60, cost: 5000, genderSpecific: false },
    ],
    assignees: [
      "Kasun Jayasuriya",
      "Ruwan Kumara",
      "Chathura Bandara",
      "Dhanushka Abeykoon",
      "Pradeep Rajapaksha",
    ],
  },
];

/**
 * Minimal row shape for a seeded row. The Supabase client is created without
 * generated database types, so the row payloads are validated by the database
 * itself; this alias keeps the casts in one place instead of scattering `any`
 * through the file.
 */
type SeedRow = Record<string, string | number | boolean | null>;

/**
 * Inserts a row into `table` using the service-role client.
 *
 * @param supabase Service-role Supabase client (bypasses RLS).
 * @param table Table name to write to.
 * @param row Row payload.
 * @param onConflict When set, the row is upserted on this column instead of
 *   inserted. Used for `profiles`, where the `handle_new_user` DB trigger has
 *   already created the row.
 */
async function writeRow(
  supabase: ReturnType<typeof createClient>,
  table: string,
  row: SeedRow,
  onConflict?: string,
): Promise<{ error: { message: string } | null }> {
  type Writer = {
    insert: (payload: SeedRow) => Promise<{ error: { message: string } | null }>;
    upsert: (
      payload: SeedRow,
      options: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
  const client = supabase.from(table) as unknown as Writer;
  return onConflict
    ? client.upsert(row, { onConflict })
    : client.insert(row);
}

/**
 * Emails that identify the three test shops (email lives in auth.users).
 *
 * Derived from `SHOPS` so the seeded shops and the emails that
 * `e2e/cleanup-data.spec.ts` tears down can never drift apart.
 */
const TEST_SHOP_EMAILS = SHOPS.map((s) => s.email);

test.describe("seed test shop data", () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  });

  test("seeds exactly the three test shop emails the cleanup spec removes", () => {
    // `e2e/cleanup-data.spec.ts` deletes data for these three emails only.
    // If a shop is added here without being added there, seeded rows would
    // leak into the database between runs.
    expect([...TEST_SHOP_EMAILS].sort()).toEqual([
      "test.autocare@nmhub.sl",
      "test.barber@nmhub.sl",
      "test.salon@nmhub.sl",
    ]);
  });

  test(
    "creates the barber shop, women's salon, and vehicle service station if absent",
    async () => {
      // ------------------------------------------------------------------
      // Idempotency check: query Supabase first. If the test shop emails
      // already exist in the database, skip creation entirely.
      // ------------------------------------------------------------------
      const { data: listedUsers } = await supabase.auth.admin.listUsers();
      const existingEmails = new Set(
        (listedUsers?.users ?? []).map((u) => u.email).filter(Boolean),
      );

      const missingShops = SHOPS.filter((s) => !existingEmails.has(s.email));

      if (missingShops.length === 0) {
        console.log(
          "[seed] All test shop emails already exist. Skipping creation.",
        );
        return;
      }

      for (const shop of missingShops) {
        // Create the auth user whose email is the shop's identity. The
        // `handle_new_user` DB trigger auto-creates the matching profile;
        // we upsert below to guarantee the shop fields are set either way.
        const { data: createdUser, error: createError } =
          await supabase.auth.admin.createUser({
            email: shop.email,
            password: SEED_PASSWORD,
            email_confirm: true,
            user_metadata: {
              shop_name: shop.shopName,
              owner_name: shop.ownerName,
              contact_info: shop.contactInfo,
            },
          });
        expect(createError).toBeNull();
        expect(createdUser?.user).toBeTruthy();
        const shopId = createdUser!.user!.id;

        // The `handle_new_user` trigger already inserted the profile row, so
        // upsert on the primary key to guarantee the shop fields are set.
        await writeRow(
          supabase,
          "profiles",
          {
            id: shopId,
            shop_name: shop.shopName,
            owner_name: shop.ownerName,
            contact_info: shop.contactInfo,
          },
          "id",
        );

        // Services (dedupe by name + shop so re-runs never duplicate).
        for (const service of shop.services) {
          const { data: existingService } = await supabase
            .from("services")
            .select("id")
            .eq("shop_id", shopId)
            .eq("name", service.name)
            .maybeSingle();
          if (existingService) continue;

          const { error: insertServiceError } = await writeRow(
            supabase,
            "services",
            {
              shop_id: shopId,
              name: service.name,
              duration_minutes: service.durationMinutes,
              cost: service.cost,
              gender_specific: service.genderSpecific,
              male_duration_minutes: service.male?.durationMinutes ?? null,
              male_cost: service.male?.cost ?? null,
              female_duration_minutes: service.female?.durationMinutes ?? null,
              female_cost: service.female?.cost ?? null,
            },
          );
          expect(insertServiceError).toBeNull();
        }

        // Assignees (dedupe by name + shop).
        for (const assigneeName of shop.assignees) {
          const { data: existingAssignee } = await supabase
            .from("assignees")
            .select("id")
            .eq("shop_id", shopId)
            .eq("name", assigneeName)
            .maybeSingle();
          if (existingAssignee) continue;

          const { error: insertAssigneeError } = await writeRow(
            supabase,
            "assignees",
            {
              shop_id: shopId,
              name: assigneeName,
              available_today: true,
            },
          );
          expect(insertAssigneeError).toBeNull();
        }

        console.log(`[seed] Seeded shop "${shop.shopName}" (${shop.email}).`);
      }
    },
  );
});
