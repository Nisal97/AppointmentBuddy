/**
 * @fileoverview unit-tests/appointment-test-helpers.ts — Shared builders for appointment action tests.
 *
 * PURPOSE
 *   Removes duplication across the four split suites (create / edit / complete / delete)
 *   by centralising the Supabase query-builder stub and FormData helpers.
 *
 *   Each suite still declares its own `vi.mock("next/cache")`,
 *   `vi.mock("next/navigation")`, and `vi.mock("@/utils/supabase/server")`
 *   blocks — Vitest hoists `vi.mock` per test file, so mocks cannot be shared
 *   from here.
 */

export type QueryResult = { data: unknown; error: unknown };

export type MockChain = Record<string, (...args: unknown[]) => MockChain> & {
  then: (resolve: (val: QueryResult) => void) => void;
};

export function buildMockChain(overrides: {
  data?: unknown;
  error?: unknown;
  singleData?: unknown;
  singleError?: unknown;
  resultsByTable?: Record<string, { data?: unknown; error?: unknown }>;
}): MockChain {
  const defaultResult = { data: overrides.data ?? null, error: overrides.error ?? null };
  const singleResult = {
    data: overrides.singleData ?? null,
    error: overrides.singleError ?? null,
  };

  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    upsert: () => chain,
    delete: () => chain,
    eq: () => chain,
    neq: () => chain,
    in: () => chain,
    order: () => chain,
    single: async () => singleResult,
    maybeSingle: async () => singleResult,
    then: (resolve: (val: QueryResult) => void) => resolve(defaultResult),
  } as unknown as MockChain;

  if (overrides.resultsByTable) {
    const resultsByTable = overrides.resultsByTable;
    const tableAwareFrom = chain as MockChain & { __resultsByTable?: typeof resultsByTable };
    tableAwareFrom.__resultsByTable = resultsByTable;
  }

  return chain;
}

/** Builds FormData from a plain object (values serialised like a real form post). */
export function buildFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

/** A valid create/edit payload — suites override fields per-case. */
export const baseValidFields = {
  customerName: "Jane Doe",
  contactNumber: "0712345678",
  appointmentDate: "2026-10-21",
  appointmentTime: "10:00",
  serviceIds: JSON.stringify(["svc-1"]),
  assigneeId: "",
  gender: "female",
};

export const VALID_SERVICE = {
  id: "svc-1",
  duration_minutes: 30,
  cost: 2500,
  gender_specific: false,
  male_duration_minutes: null,
  male_cost: null,
  female_duration_minutes: null,
  female_cost: null,
};
