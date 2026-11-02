/**
 * @fileoverview unit-tests/conflict-math.test.ts — Unit tests for the pure
 * conflict helpers in src/lib/conflict.ts.
 *
 * Covers:
 *   - hasConflict: exact, partial-start, partial-end and enclosed overlap,
 *     plus adjacent (back-to-back) boundaries that must NOT conflict.
 *   - getAvailableStaff: returns only staff with zero overlapping appointments.
 *
 * TO RUN: npm run test:unit -- conflict-math
 */
import { describe, it, expect } from "vitest";
import {
  type AppointmentLike,
  type StaffLike,
  getAvailableStaff,
  hasConflict,
} from "@/lib/conflict";

const appointment = (overrides: Partial<AppointmentLike>): AppointmentLike => ({
  id: "appt-1",
  appointment_time: "10:00",
  total_duration_minutes: 30,
  assignee_id: "staff-1",
  ...overrides,
});

const staffMember = (overrides: Partial<StaffLike>): StaffLike => ({
  id: "staff-1",
  name: "Sam",
  available_today: true,
  ...overrides,
});

describe("hasConflict(newStart, duration, existingAppts)", () => {
  it("detects an exact overlap (same start and end)", () => {
    // Proposed 10:00-10:30 vs existing 10:00-10:30.
    expect(
      hasConflict(600, 30, [appointment({ appointment_time: "10:00", total_duration_minutes: 30 })]),
    ).toBe(true);
  });

  it("detects a partial start overlap (new starts before, ends during existing)", () => {
    // Proposed 09:50-10:20 vs existing 10:00-10:30.
    expect(
      hasConflict(590, 30, [appointment({ appointment_time: "10:00", total_duration_minutes: 30 })]),
    ).toBe(true);
  });

  it("detects a partial end overlap (new starts during, ends after existing)", () => {
    // Proposed 10:10-10:40 vs existing 10:00-10:30.
    expect(
      hasConflict(610, 30, [appointment({ appointment_time: "10:00", total_duration_minutes: 30 })]),
    ).toBe(true);
  });

  it("detects an enclosed duration (existing appointment fully inside new)", () => {
    // Proposed 10:00-11:00 vs existing 10:10-10:40.
    expect(
      hasConflict(600, 60, [
        appointment({ appointment_time: "10:10", total_duration_minutes: 30 }),
      ]),
    ).toBe(true);
  });

  it("returns NO conflict for adjacent times where new ends as existing starts", () => {
    // Proposed 10:00-10:30 vs existing 10:30-11:00 (back-to-back).
    expect(
      hasConflict(600, 30, [
        appointment({ appointment_time: "10:30", total_duration_minutes: 30 }),
      ]),
    ).toBe(false);
  });

  it("returns NO conflict for adjacent times where existing ends as new starts", () => {
    // Proposed 10:30-11:00 vs existing 10:00-10:30 (back-to-back).
    expect(
      hasConflict(630, 30, [appointment({ appointment_time: "10:00", total_duration_minutes: 30 })]),
    ).toBe(false);
  });

  it("returns NO conflict when appointments are far apart", () => {
    // Proposed 11:40-12:10 vs existing 10:00-10:30.
    expect(
      hasConflict(700, 30, [appointment({ appointment_time: "10:00", total_duration_minutes: 30 })]),
    ).toBe(false);
  });

  it("returns NO conflict when there are no existing appointments", () => {
    expect(hasConflict(600, 30, [])).toBe(false);
  });

  it("considers only the overlapping window regardless of assignee", () => {
    // hasConflict is given appointments already filtered to one staff member.
    expect(
      hasConflict(600, 30, [
        appointment({ id: "appt-2", assignee_id: "staff-2" }), // different staff, same time
      ]),
    ).toBe(true);
  });
});

describe("getAvailableStaff(allStaff, newStart, duration, appts)", () => {
  const baseAppts = [
    appointment({ id: "appt-1", appointment_time: "10:15", total_duration_minutes: 30, assignee_id: "staff-1" }),
  ];

  it("returns only staff with zero overlapping appointments", () => {
    // Proposed 10:00-10:30. staff-1 is booked 10:15-10:45 (overlaps).
    const allStaff = [
      staffMember({ id: "staff-1", name: "Sam" }),
      staffMember({ id: "staff-2", name: "Pat" }),
      staffMember({ id: "staff-3", name: "Lee" }),
    ];
    const available = getAvailableStaff(allStaff, 600, 30, baseAppts);
    expect(available.map((s) => s.id)).toEqual(["staff-2", "staff-3"]);
  });

  it("keeps staff whose only appointment is back-to-back (adjacent)", () => {
    // Proposed 10:00-10:30. staff-1 booked 10:30-11:00 — adjacent, not a conflict.
    const allStaff = [
      staffMember({ id: "staff-1", name: "Sam" }),
      staffMember({ id: "staff-2", name: "Pat" }),
    ];
    const appts = [
      appointment({
        id: "appt-1",
        appointment_time: "10:30",
        total_duration_minutes: 30,
        assignee_id: "staff-1",
      }),
    ];
    const available = getAvailableStaff(allStaff, 600, 30, appts);
    expect(available.map((s) => s.id)).toEqual(["staff-1", "staff-2"]);
  });

  it("returns all staff when there are no appointments", () => {
    const allStaff = [
      staffMember({ id: "staff-1", name: "Sam" }),
      staffMember({ id: "staff-2", name: "Pat" }),
    ];
    const available = getAvailableStaff(allStaff, 600, 30, []);
    expect(available.map((s) => s.id)).toEqual(["staff-1", "staff-2"]);
  });

  it("returns an empty list when every staff member overlaps", () => {
    const allStaff = [
      staffMember({ id: "staff-1", name: "Sam" }),
      staffMember({ id: "staff-2", name: "Pat" }),
    ];
    const appts = [
      appointment({ id: "appt-1", assignee_id: "staff-1" }),
      appointment({ id: "appt-2", assignee_id: "staff-2" }),
    ];
    const available = getAvailableStaff(allStaff, 600, 30, appts);
    expect(available).toEqual([]);
  });

  it("ignores appointments belonging to other staff members", () => {
    // Proposed 10:00-10:30 for staff-1; the only appointment belongs to staff-2.
    const allStaff = [staffMember({ id: "staff-1", name: "Sam" })];
    const appts = [appointment({ id: "appt-1", assignee_id: "staff-2" })];
    const available = getAvailableStaff(allStaff, 600, 30, appts);
    expect(available.map((s) => s.id)).toEqual(["staff-1"]);
  });
});
