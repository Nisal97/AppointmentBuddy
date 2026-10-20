/**
 * @fileoverview Complete action tests — Done button on upcoming cards.
 * TO RUN: npm run test:unit -- appointment-complete
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { completeAppointment, type MutationState } from "@/app/(app)/appointments/actions";
import { buildFormData, buildMockChain } from "./appointment-test-helpers";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockAuth = { getUser: vi.fn() };
const mockFrom = vi.fn();
const mockSupabase = { auth: mockAuth, from: mockFrom } as unknown as Awaited<
  ReturnType<typeof createClient>
>;
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn(async () => mockSupabase) }));

import { createClient } from "@/utils/supabase/server";
const mockedCreateClient = vi.mocked(createClient);
const mockedFrom = vi.mocked(mockFrom);
const mockedGetUser = vi.mocked(mockAuth.getUser);

describe("completeAppointment", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns error when user is not signed in", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await completeAppointment({} as MutationState, buildFormData({ appointmentId: "appt-1" }));
    expect(result.error).toBe("You must be signed in.");
  });

  it("returns error when appointment ID is missing", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await completeAppointment({} as MutationState, buildFormData({ appointmentId: "" }));
    expect(result.error).toBe("Missing appointment.");
  });

  it("marks appointment as completed successfully", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation(() => buildMockChain({ error: null }));
    const result = await completeAppointment({} as MutationState, buildFormData({ appointmentId: "appt-1" }));
    expect(result.error).toBeUndefined();
    expect(result.message).toBe("Appointment marked as done.");
    expect(mockedFrom).toHaveBeenCalledWith("appointments");
  });

  it("returns error when supabase update fails", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation(() => buildMockChain({ error: { message: "db error" } }));
    const result = await completeAppointment({} as MutationState, buildFormData({ appointmentId: "appt-1" }));
    expect(result.error).toBe("db error");
  });
});
