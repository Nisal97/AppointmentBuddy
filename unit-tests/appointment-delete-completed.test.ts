/**
 * @fileoverview Delete-completed tests — delete flow from the completed details modal.
 * TO RUN: npm run test:unit -- appointment-delete-completed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteAppointment, type MutationState } from "@/app/(app)/appointments/actions";
import { buildFormData, buildMockChain } from "./appointment-test-helpers";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const mockAuth = { getUser: vi.fn() };
const mockFrom = vi.fn();
const mockSupabase = { auth: mockAuth, from: mockFrom } as unknown as Awaited<
  ReturnType<typeof createClient>
>;
vi.mock("@/utils/supabase/server", () => ({ createClient: vi.fn(async () => mockSupabase) }));

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
const mockedCreateClient = vi.mocked(createClient);
const mockedRevalidatePath = vi.mocked(revalidatePath);
const mockedFrom = vi.mocked(mockFrom);
const mockedGetUser = vi.mocked(mockAuth.getUser);

describe("deleteAppointment (completed)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns error when user is not signed in", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await deleteAppointment({} as MutationState, buildFormData({ appointmentId: "appt-1" }));
    expect(result.error).toBe("You must be signed in.");
  });

  it("returns error when appointment ID is missing", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await deleteAppointment({} as MutationState, buildFormData({ appointmentId: "" }));
    expect(result.error).toBe("Missing appointment.");
  });

  it("returns error when supabase delete fails", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation(() => buildMockChain({ error: { message: "delete failed" } }));
    const result = await deleteAppointment({} as MutationState, buildFormData({ appointmentId: "appt-1" }));
    expect(result.error).toBe("delete failed");
  });

  it("deletes appointment successfully", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation(() => buildMockChain({ error: null }));
    const result = await deleteAppointment({} as MutationState, buildFormData({ appointmentId: "appt-1" }));
    expect(result.error).toBeUndefined();
    expect(result.message).toBe("Appointment deleted.");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/appointments");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/home", "layout");
    expect(mockedFrom).toHaveBeenCalledWith("appointments");
  });
});
