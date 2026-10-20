/**
 * Unit tests for gender.ts — shared helpers for appointment duration & price calculation.
 *
 * These tests cover the pure functions in gender.ts without any Supabase or browser
 * dependencies, so they run fast and reliably in any environment.
 *
 * Technology: Vitest (https://vitest.dev)
 *   - Chosen because it is TypeScript-native, fast, and has a Jest-compatible API.
 *   - Runs in Node.js environment (no DOM needed for these helpers).
 *
 * To run:
 *   npm run test:unit          (run once)
 *   npm run test:unit:watch    (watch mode)
 */

import { describe, it, expect } from "vitest";
import {
  normalizeGender,
  serviceDurationMinutes,
  serviceCost,
  formatMoney,
  type AppointmentGender,
  type GenderedService,
} from "@/app/(app)/appointments/gender";

// ---------------------------------------------------------------------------
// Helpers to build test service objects
// ---------------------------------------------------------------------------

/** Builds a non-gender-specific service (same duration/cost for all genders). */
function plainService(
  durationMinutes: number = 30,
  cost: number = 1000,
): GenderedService {
  return {
    duration_minutes: durationMinutes,
    cost,
    gender_specific: false,
    male_duration_minutes: null,
    male_cost: null,
    female_duration_minutes: null,
    female_cost: null,
  };
}

/** Builds a gender-specific service with separate male/female overrides. */
function genderedService(
  baseDuration: number = 30,
  baseCost: number = 1000,
  maleDuration?: number | null,
  maleCost?: number | null,
  femaleDuration?: number | null,
  femaleCost?: number | null,
): GenderedService {
  return {
    duration_minutes: baseDuration,
    cost: baseCost,
    gender_specific: true,
    male_duration_minutes: maleDuration ?? null,
    male_cost: maleCost ?? null,
    female_duration_minutes: femaleDuration ?? null,
    female_cost: femaleCost ?? null,
  };
}

describe("normalizeGender", () => {
  it("returns 'male' when given 'male'", () => {
    expect(normalizeGender("male")).toBe("male");
  });

  it("returns 'female' when given 'female'", () => {
    expect(normalizeGender("female")).toBe("female");
  });

  it("falls back to 'male' for undefined", () => {
    expect(normalizeGender(undefined)).toBe("male");
  });

  it("falls back to 'male' for null", () => {
    expect(normalizeGender(null)).toBe("male");
  });

  it("falls back to 'male' for an empty string", () => {
    expect(normalizeGender("")).toBe("male");
  });

  it("falls back to 'male' for an unknown string", () => {
    expect(normalizeGender("other")).toBe("male");
  });

  it("falls back to 'male' for a number", () => {
    expect(normalizeGender(42 as unknown as AppointmentGender)).toBe("male");
  });

  it("falls back to 'male' for an object", () => {
    expect(normalizeGender({} as unknown as AppointmentGender)).toBe("male");
  });
});

describe("serviceDurationMinutes", () => {
  it("returns base duration for a non-gender-specific service (male)", () => {
    const service = plainService(45, 1000);
    expect(serviceDurationMinutes(service, "male")).toBe(45);
  });

  it("returns base duration for a non-gender-specific service (female)", () => {
    const service = plainService(45, 1000);
    expect(serviceDurationMinutes(service, "female")).toBe(45);
  });

  it("returns male-specific duration when gender_specific and male override is set", () => {
    const service = genderedService(30, 1000, 60, null, null, null);
    expect(serviceDurationMinutes(service, "male")).toBe(60);
  });

  it("returns female-specific duration when gender_specific and female override is set", () => {
    const service = genderedService(30, 1000, null, null, 90, null);
    expect(serviceDurationMinutes(service, "female")).toBe(90);
  });

  it("falls back to base duration when male override is null", () => {
    const service = genderedService(30, 1000, null, null, null, null);
    expect(serviceDurationMinutes(service, "male")).toBe(30);
  });

  it("falls back to base duration when female override is null", () => {
    const service = genderedService(30, 1000, null, null, null, null);
    expect(serviceDurationMinutes(service, "female")).toBe(30);
  });

  it("floors fractional durations via toInt", () => {
    const service = plainService(30.7, 1000);
    expect(serviceDurationMinutes(service, "male")).toBe(30);
  });
});

describe("serviceCost", () => {
  it("returns base cost for a non-gender-specific service (male)", () => {
    const service = plainService(30, 2500);
    expect(serviceCost(service, "male")).toBe(2500);
  });

  it("returns base cost for a non-gender-specific service (female)", () => {
    const service = plainService(30, 2500);
    expect(serviceCost(service, "female")).toBe(2500);
  });

  it("returns male-specific cost when gender_specific and male override is set", () => {
    const service = genderedService(30, 1000, null, 1500, null, null);
    expect(serviceCost(service, "male")).toBe(1500);
  });

  it("returns female-specific cost when gender_specific and female override is set", () => {
    const service = genderedService(30, 1000, null, null, null, 2000);
    expect(serviceCost(service, "female")).toBe(2000);
  });

  it("falls back to base cost when male override is null", () => {
    const service = genderedService(30, 1000, null, null, null, null);
    expect(serviceCost(service, "male")).toBe(1000);
  });

  it("falls back to base cost when female override is null", () => {
    const service = genderedService(30, 1000, null, null, null, null);
    expect(serviceCost(service, "female")).toBe(1000);
  });
});

describe("formatMoney", () => {
  it("formats a whole number with two decimal places", () => {
    expect(formatMoney(10)).toBe("10.00");
  });

  it("formats a number with existing decimals", () => {
    expect(formatMoney(10.5)).toBe("10.50");
  });

  it("formats zero", () => {
    expect(formatMoney(0)).toBe("0.00");
  });

  it("formats a large number with thousands separators", () => {
    expect(formatMoney(1234567.89)).toBe("1,234,567.89");
  });
});

