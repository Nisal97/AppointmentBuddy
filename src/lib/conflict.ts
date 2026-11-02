/**
 * @fileoverview src/lib/conflict.ts — Pure appointment conflict helpers.
 *
 * These helpers are intentionally free of Supabase/Next.js dependencies so they
 * can be unit-tested in isolation (Node environment, no DOM). They mirror the
 * overlap math used by `checkAppointmentConflict` in
 * `src/app/(app)/appointments/actions.ts`.
 */

export interface AppointmentLike {
  id: string;
  appointment_time: string; // "HH:MM"
  total_duration_minutes: number;
  assignee_id: string;
}

export interface StaffLike {
  id: string;
  name: string;
  available_today: boolean;
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/**
 * Returns true if `[newStart, newStart + duration)` overlaps any existing
 * appointment. Adjacent boundaries (end === start) are NOT considered a
 * conflict, so back-to-back appointments are allowed.
 *
 * `newStart` is expressed in minutes since midnight.
 */
export function hasConflict(
  newStart: number,
  duration: number,
  existingAppts: AppointmentLike[],
): boolean {
  const newEnd = newStart + duration;
  return existingAppts.some((appt) => {
    const existingStart = timeToMinutes(appt.appointment_time);
    const existingEnd = existingStart + (appt.total_duration_minutes ?? 0);
    return newStart < existingEnd && newEnd > existingStart;
  });
}

/**
 * Returns staff members with zero overlapping appointments during
 * `[newStart, newStart + duration)`.
 */
export function getAvailableStaff(
  allStaff: StaffLike[],
  newStart: number,
  duration: number,
  appts: AppointmentLike[],
): StaffLike[] {
  const newEnd = newStart + duration;
  return allStaff.filter((staff) => {
    return !appts.some((appt) => {
      if (appt.assignee_id !== staff.id) return false;
      const existingStart = timeToMinutes(appt.appointment_time);
      const existingEnd = existingStart + (appt.total_duration_minutes ?? 0);
      return newStart < existingEnd && newEnd > existingStart;
    });
  });
}
