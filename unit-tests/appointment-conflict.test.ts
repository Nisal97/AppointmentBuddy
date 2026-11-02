/**
 * @fileoverview appointment-conflict.test.ts — Unit tests for checkAppointmentConflict.
 * Covers overlap detection (newStart < existingEnd && newEnd > existingStart),
 * back-to-back boundaries, available-staff filtering, and input validation.
 * TO RUN: npm run test:unit -- appointment-conflict
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkAppointmentConflict,
  type ConflictCheckResult,
} from "@/app/(app)/appointments/actions";
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

const conflictFields = {
  appointmentDate: "2026-10-21",
  appointmentTime: "10:00",
  durationMinutes: "30",
  assigneeId: "staff-1",
};

const staffRows = [
  { id: "staff-1", name: "Sam", available_today: true },
  { id: "staff-2", name: "Pat", available_today: true },
  { id: "staff-3", name: "Lee", available_today: true },
];

function mockTables(appointmentsRows: unknown[]) {
  mockedFrom.mockImplementation((table: string) => {
    if (table === "appointments")
      return buildMockChain({ data: appointmentsRows, error: null });
    if (table === "assignees")
      return buildMockChain({ data: staffRows, error: null });
    return buildMockChain({ error: null });
  });
}

describe("checkAppointmentConflict", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedCreateClient.mockResolvedValue(mockSupabase);
  });
  afterEach(() => { vi.restoreAllMocks(); });

  it("returns no conflict and makes no queries when the user is not signed in", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const result = await checkAppointmentConflict(
      null,
      buildFormData(conflictFields),
    );
    expect(result).toEqual<ConflictCheckResult>({
      conflict: false,
      conflictWith: null,
      availableAssignees: [],
    });
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("returns no conflict when required fields are missing", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await checkAppointmentConflict(
      null,
      buildFormData({ ...conflictFields, appointmentDate: "", appointmentTime: "" }),
    );
    expect(result.conflict).toBe(false);
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("returns no conflict for an invalid date or time", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const badDate = await checkAppointmentConflict(
      null,
      buildFormData({ ...conflictFields, appointmentDate: "not-a-date" }),
    );
    const badTime = await checkAppointmentConflict(
      null,
      buildFormData({ ...conflictFields, appointmentTime: "25:00" }),
    );
    expect(badDate.conflict).toBe(false);
    expect(badTime.conflict).toBe(false);
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("returns no conflict when duration is zero or missing", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const zero = await checkAppointmentConflict(
      null,
      buildFormData({ ...conflictFields, durationMinutes: "0" }),
    );
    const missing = await checkAppointmentConflict(
      null,
      buildFormData({ ...conflictFields, durationMinutes: "" }),
    );
    expect(zero.conflict).toBe(false);
    expect(missing.conflict).toBe(false);
  });

  it("returns no conflict when no assignee is selected", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    const result = await checkAppointmentConflict(
      null,
      buildFormData({ ...conflictFields, assigneeId: "" }),
    );
    expect(result).toEqual<ConflictCheckResult>({
      conflict: false,
      conflictWith: null,
      availableAssignees: [],
    });
    expect(mockedFrom).not.toHaveBeenCalled();
  });

  it("flags a conflict with the selected staff and lists the remaining free staff", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    mockTables([
      {
        id: "appt-1",
        customer_name: "Jane Doe",
        appointment_time: "10:15",
        total_duration_minutes: 30,
        assignee_id: "staff-1",
      },
    ]);
    const result = await checkAppointmentConflict(null, buildFormData(conflictFields));
    expect(result.conflict).toBe(true);
    expect(result.conflictWith).toMatchObject({
      id: "appt-1",
      customer_name: "Jane Doe",
      appointment_time: "10:15",
      total_duration_minutes: 30,
      assignee_id: "staff-1",
    });
    // Proposed 10:00-10:30 overlaps the existing 10:15-10:45 for staff-1.
    expect(result.availableAssignees.map((a) => a.id)).toEqual([
      "staff-2",
      "staff-3",
    ]);
  });

  it("treats back-to-back appointments as non-conflicting", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    // Existing 10:30-11:00; proposed 10:00-10:30 — end equals start, no overlap.
    mockTables([
      {
        id: "appt-1",
        customer_name: "Jane Doe",
        appointment_time: "10:30",
        total_duration_minutes: 30,
        assignee_id: "staff-1",
      },
    ]);
    const result = await checkAppointmentConflict(null, buildFormData(conflictFields));
    expect(result.conflict).toBe(false);
    expect(result.conflictWith).toBeNull();
    expect(result.availableAssignees.map((a) => a.id)).toEqual([
      "staff-1",
      "staff-2",
      "staff-3",
    ]);
  });

  it("keeps a free selected staff in the available list but excludes a busy colleague", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    // staff-2 is booked at the same time; staff-1 (selected) is free.
    mockTables([
      {
        id: "appt-1",
        customer_name: "Jane Doe",
        appointment_time: "10:00",
        total_duration_minutes: 30,
        assignee_id: "staff-2",
      },
    ]);
    const result = await checkAppointmentConflict(null, buildFormData(conflictFields));
    expect(result.conflict).toBe(false);
    expect(result.availableAssignees.map((a) => a.id)).toEqual([
      "staff-1",
      "staff-3",
    ]);
  });

  it("ignores the appointment being edited when an exclude id is provided", async () => {
    mockedGetUser.mockResolvedValue({ data: { user: { id: "shop-1" } }, error: null });
    // Same slot as the existing appointment, but it is the one being rescheduled.
    mockTables([
      {
        id: "appt-1",
        customer_name: "Jane Doe",
        appointment_time: "10:15",
        total_duration_minutes: 30,
        assignee_id: "staff-1",
      },
    ]);
    const result = await checkAppointmentConflict(
      null,
      buildFormData({ ...conflictFields, excludeAppointmentId: "appt-1" }),
    );
    expect(result.conflict).toBe(false);
    expect(result.conflictWith).toBeNull();
    expect(result.availableAssignees.map((a) => a.id)).toEqual([
      "staff-1",
      "staff-2",
      "staff-3",
    ]);
  });
});
