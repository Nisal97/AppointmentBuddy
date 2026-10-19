"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createAppointment,
  type AppointmentAssigneeOption,
  type AppointmentServiceOption,
  type AppointmentState,
} from "../actions";
import { AssigneeSelect, ServiceCheckboxes } from "./appointment-fields";

const inputBase =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-400/30";

const labelClass =
  "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

const saveButton =
  "w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/35 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]";

function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type AppointmentFormProps = {
  services: AppointmentServiceOption[];
  assignees: AppointmentAssigneeOption[];
};

export function AppointmentForm({ services, assignees }: AppointmentFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState<
    AppointmentState,
    FormData
  >(createAppointment, {});

  const totalDuration = useMemo(
    () =>
      services
        .filter((service) => selectedIds.includes(service.id))
        .reduce((sum, service) => sum + service.duration_minutes, 0),
    [services, selectedIds],
  );

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const submitWithPayload = (formData: FormData) => {
    formData.set("serviceIds", JSON.stringify(selectedIds));
    formAction(formData);
  };

  return (
    <form action={submitWithPayload} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="customerName" className={labelClass}>
            Customer name{" "}
            <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
          </label>
          <input
            id="customerName"
            name="customerName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Alex Perera"
            disabled={isPending}
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="contactNumber" className={labelClass}>
            Contact number <span className="text-red-500">*</span>
          </label>
          <input
            id="contactNumber"
            name="contactNumber"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            placeholder="e.g. 077 123 4567"
            disabled={isPending}
            className={inputBase}
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="appointmentDate" className={labelClass}>
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="appointmentDate"
            name="appointmentDate"
            type="date"
            required
            defaultValue={todayLocal()}
            min={todayLocal()}
            disabled={isPending}
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="appointmentTime" className={labelClass}>
            Time <span className="text-red-500">*</span>
          </label>
          <input
            id="appointmentTime"
            name="appointmentTime"
            type="time"
            required
            step={300}
            disabled={isPending}
            className={inputBase}
          />
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Services <span className="text-red-500">*</span>
        </legend>
        <ServiceCheckboxes
          services={services}
          selectedIds={selectedIds}
          isPending={isPending}
          onToggle={toggleService}
        />
      </fieldset>
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/10"
      >
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          Estimated total duration
        </span>
        <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
          {totalDuration} min
        </span>
      </div>
      <AssigneeSelect assignees={assignees} isPending={isPending} />
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {state.error}
        </p>
      )}
      <button type="submit" disabled={isPending} className={saveButton}>
        {isPending ? "Creating…" : "Create appointment"}
      </button>
    </form>
  );
}
