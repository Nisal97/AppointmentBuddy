import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_EMAIL = "test2@gmail.com";

// Note: The app's password policy requires at least one symbol, so we use
// "Password2!" (the spec's "Password2" lacks a symbol and would fail validation).
const TEST_PASSWORD = "Password2!";

test.describe("user registration", () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string | null = null;

  test.beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  });

  test("user registration test", async ({ page }) => {
    // Navigate to the registration/onboarding page.
    await page.goto("/signup");

    // Fill in the registration form fields.
    await page.locator('input[name="shopName"]').fill("test 2");
    await page.locator('input[name="ownerName"]').fill("test owner 2");
    await page.locator('input[name="contactInfo"]').fill("0342228915");
    await page.locator('input[name="email"]').fill(TEST_EMAIL);
    await page.locator('input[name="password"]').fill(TEST_PASSWORD);
    await page.locator('input[name="confirmPassword"]').fill(TEST_PASSWORD);

    // Click Submit.
    await page.click('id=signupSubmitButton');

    // Assert successful registration/redirect to the dashboard.
    await expect(page).toHaveURL("/home");
  });

  test.afterAll(async () => {
    // Database teardown: delete the test user and associated shop profile
    // from Supabase to keep the test idempotent.
    if (!testUserId) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const testUser = users?.users.find((u) => u.email === TEST_EMAIL);
      testUserId = testUser?.id ?? null;
    }

    if (testUserId) {
      // Delete the profile row first (references auth.users).
      await supabase.from("profiles").delete().eq("id", testUserId);
      // Delete the auth user.
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });
});
