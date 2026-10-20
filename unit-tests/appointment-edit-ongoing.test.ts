/**
 * @fileoverview appointment-edit-ongoing.test.ts — Unit tests for updateAppointment.
 * Covers the edit-modal save on upcoming appointments: auth, validation,
 * completed-guard, service/assignee resolution, relink, and success message.
 * TO RUN: npm run test:unit -- appointment-edit-ongoing
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { updateAppointment, type MutationState } from "@/app/(app)/appointments/actions";
import { baseValidFields, buildFormData, buildMockChain, VALID_SERVICE } from "./appointment-test-helpers";

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

const editFields = {
  ...baseValidFields,
  appointmentId: "appt-1",
  customerName: "John Doe",
};

describe("updateAppointment (ongoing)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns error when user is not signed in", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await updateAppointment({} as MutationState, buildFormData({ ...editFields }));
    expect(result.error).toBe("You must be signed in.");
  });

  it("returns error when appointment ID is missing", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await updateAppointment({} as MutationState, buildFormData({ ...editFields, appointmentId: "" }));
    expect(result.error).toBe("Missing appointment.");
  });

  it("returns error when validation fails", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await updateAppointment(
      {} as MutationState,
      buildFormData({ ...editFields, contactNumber: "", appointmentDate: "bad", appointmentTime: "bad", serviceIds: JSON.stringify([]) }),
    );
    expect(result.error).toBe("Contact number is required.");
  });

  it("returns error when appointment is not found", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockedFrom.mockImplementation(() => buildMockChain({ singleData: null }));
    const result = await updateAppointment({} as MutationState, buildFormData({ ...editFields }));
    expect(result.error).toBe("Appointment not found.");
  });

  it("returns error when appointment is already completed", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    let callCount = 0;
    mockedFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return buildMockChain({ singleData: { id: "appt-1", status: "completed" } });
      return buildMockChain({ data: [VALID_SERVICE] });
    });
    const result = await updateAppointment({} as MutationState, buildFormData({ ...editFields }));
    expect(result.error).toBe("Completed appointments can no longer be edited.");
  });

  it("updates appointment and relinks services successfully", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    // Sequential `from()` calls: existing fetch, services, assignees skip (no
    // assigneeId), update returning one row, delete links, insert links.
    let callCount = 0;
    mockedFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return buildMockChain({ singleData: { id: "appt-1", status: "upcoming" } });
      if (callCount === 2) return buildMockChain({ data: [VALID_SERVICE] });
      if (callCount === 3) return buildMockChain({ data: [{ id: "appt-1" }] });
      return buildMockChain({ error: null });
    });
    const result = await updateAppointment({} as MutationState, buildFormData({ ...editFields }));
    expect(result.error).toBeUndefined();
    expect(result.message).toBe("Appointment updated.");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/appointments");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/home", "layout");
  });

  it("returns error when concurrent completion removes the row", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    let callCount = 0;
    mockedFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return buildMockChain({ singleData: { id: "appt-1", status: "upcoming" } });
      if (callCount === 2) return buildMockChain({ data: [VALID_SERVICE] });
      if (callCount === 3) return buildMockChain({ data: [] });
      return buildMockChain({ error: null });
    });
    const result = await updateAppointment({} as MutationState, buildFormData({ ...editFields }));
    expect(result.error).toBe("This appointment could not be updated — it may have been completed or deleted.");
  });
});
