"use client";

import { useActionState } from "react";
import {
  completeAppointment,
  type AppointmentCardData,
  type MutationState,
} from "./actions";
import { formatDate, formatTime } from "./format";
import { formatMoney } from "./gender";

type AppointmentCardProps = {
  appointment: AppointmentCardData;
  onEdit: (appointment: AppointmentCardData) => void;
};

export function AppointmentCard({ appointment, onEdit }: AppointmentCardProps) {
  const [state, formAction, isPending] = useActionState<
    MutationState,
    FormData
  >(completeAppointment, {});
  const isUpcoming = appointment.status === "upcoming";
  const isCompleted = appointment.status === "completed";

  return (
    <article
      onClick={() => onEdit(appointment)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit(appointment);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${
        isCompleted ? "View details for" : "Edit appointment for"
      } ${appointment.customer_name || appointment.contact_number}`}
      className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-zinc-900 dark:text-white">
            {appointment.customer_name || "Walk-in customer"}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {appointment.contact_number}
          </p>
        </div>
        {isUpcoming && (
          <form
            action={formAction}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <input type="hidden" name="appointmentId" value={appointment.id} />
            <button
              id={`appointment-${appointment.id}-doneButton`}
              type="submit"
              disabled={isPending}
              className="shrink-0 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-teal-700 disabled:opacity-70 active:scale-[0.98]"
            >
              {isPending ? "Saving…" : "Done"}
            </button>
          </form>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Date</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatDate(appointment.appointment_date)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Time</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatTime(appointment.appointment_time.slice(0, 5))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Duration</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {appointment.total_duration_minutes} min
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Price</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatMoney(appointment.total_cost)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Assignee</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {appointment.assignee_name ?? "No preference"}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {appointment.services.map((service) => (
          <span
            key={service.id}
            className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
          >
            {service.name}
          </span>
        ))}
      </div>
    </article>
  );
}
