"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  checkAppointmentConflict,
  createAppointment,
  type AppointmentAssigneeOption,
  type AppointmentServiceOption,
  type AppointmentState,
  type ConflictCheckResult,
} from "../actions";
import { formatTime } from "../format";
import { formatMoney } from "../gender";
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

  const totalPrice = useMemo(
    () =>
      services
        .filter((service) => selectedIds.includes(service.id))
        .reduce((sum, service) => sum + service.cost, 0),
    [services, selectedIds],
  );

  const [appointmentDate, setAppointmentDate] = useState(todayLocal());
  const [appointmentTime, setAppointmentTime] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [availableStaffChoice, setAvailableStaffChoice] = useState("");

  const [conflictState, setConflictState] = useState<ConflictCheckResult>({
    conflict: false,
    conflictWith: null,
    availableAssignees: [],
  });
  // Guards against stale responses when the user changes inputs faster than
  // the server check resolves.
  const checkSequence = useRef(0);

  const inputsComplete = Boolean(
    appointmentDate && appointmentTime && selectedAssigneeId && totalDuration > 0,
  );
  // When the inputs aren't checkable (e.g. no assignee picked) there can be no
  // conflict, so surface a fresh empty result instead of a stale warning.
  const activeConflict = inputsComplete
    ? conflictState
    : { conflict: false, conflictWith: null, availableAssignees: [] };
  const hasConflict = activeConflict.conflict && !!activeConflict.conflictWith;

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const submitWithPayload = (formData: FormData) => {
    formData.set("serviceIds", JSON.stringify(selectedIds));
    formAction(formData);
  };

  useEffect(() => {
    let cancelled = false;
    if (!appointmentDate || !appointmentTime || !selectedAssigneeId) return;
    if (totalDuration <= 0) return;

    const sequence = ++checkSequence.current;
    const formData = new FormData();
    formData.set("appointmentDate", appointmentDate);
    formData.set("appointmentTime", appointmentTime);
    formData.set("assigneeId", selectedAssigneeId);
    formData.set("durationMinutes", String(totalDuration));

    checkAppointmentConflict(null, formData).then((result) => {
      if (cancelled || sequence !== checkSequence.current) return;
      setConflictState(result);
      setAvailableStaffChoice("");
    });

    return () => {
      cancelled = true;
    };
  }, [appointmentDate, appointmentTime, selectedAssigneeId, totalDuration]);

  return (
    <form action={submitWithPayload} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label id="newAppointmentCustomerNameLabel" htmlFor="customerName" className={labelClass}>
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
          <label id="newAppointmentContactNumberLabel" htmlFor="contactNumber" className={labelClass}>
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
          <label id="newAppointmentDateLabel" htmlFor="appointmentDate" className={labelClass}>
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="appointmentDate"
            name="appointmentDate"
            type="date"
            required
            value={appointmentDate}
            min={todayLocal()}
            disabled={isPending}
            onChange={(event) => setAppointmentDate(event.target.value)}
            className={inputBase}
          />
        </div>
        <div>
          <label id="newAppointmentTimeLabel" htmlFor="appointmentTime" className={labelClass}>
            Time <span className="text-red-500">*</span>
          </label>
          <input
            id="appointmentTime"
            name="appointmentTime"
            type="time"
            required
            step={300}
            value={appointmentTime}
            disabled={isPending}
            onChange={(event) => setAppointmentTime(event.target.value)}
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
        className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm dark:border-indigo-500/20 dark:bg-indigo-500/10"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            Estimated duration
          </span>
          <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
            {totalDuration} min
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-zinc-600 dark:text-zinc-300">
            Estimated price
          </span>
          <span className="text-base font-bold text-indigo-700 dark:text-indigo-300">
            {formatMoney(totalPrice)}
          </span>
        </div>
      </div>
      <AssigneeSelect
        assignees={assignees}
        value={selectedAssigneeId}
        onChange={setSelectedAssigneeId}
        isPending={isPending}
      />
      {hasConflict && (
        <div
          role="alert"
          aria-live="polite"
          className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-900/10 dark:text-amber-300"
        >
          <span className="font-medium text-amber-900 dark:text-amber-200">
            Scheduling conflict
          </span>
          <p>
            Conflicts with the{" "}
            <span className="font-medium">
              {formatTime(conflictState.conflictWith!.appointment_time)}
            </span>{" "}
            appointment for{" "}
            <span className="font-medium">
              {conflictState.conflictWith!.customer_name}
            </span>
            .
          </p>
          {conflictState.availableAssignees.length > 0 ? (
            <div className="mt-2 space-y-2">
              <label className="mb-1 block text-xs font-medium text-amber-700 dark:text-amber-400">
                Find available staff
              </label>
              <select
                value={availableStaffChoice}
                onChange={(event) => setAvailableStaffChoice(event.target.value)}
                disabled={isPending}
                className={inputBase}
              >
                <option value="">Choose a staff member</option>
                {conflictState.availableAssignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!availableStaffChoice || isPending}
                onClick={() => {
                  setSelectedAssigneeId(availableStaffChoice);
                  setAvailableStaffChoice("");
                }}
                className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 disabled:opacity-60 disabled:cursor-not-allowed dark:border-zinc-800/30 dark:bg-zinc-900 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
              >
                Assign to{" "}
                {assignees.find((assignee) => assignee.id === availableStaffChoice)
                  ?.name}
              </button>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Switching clears the conflict before you submit.
              </p>
            </div>
          ) : (
            <p className="text-amber-600 dark:text-amber-400">
              No other staff are free during this time.
            </p>
          )}
        </div>
      )}
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
        >
          {state.error}
        </p>
      )}
      <button
        id="newAppointmentCreateButton"
        type="submit"
        disabled={isPending || hasConflict}
        className={saveButton}
      >
        {hasConflict ? "Resolve the conflict above" : isPending ? "Creating…" : "Create appointment"}
      </button>
    </form>
  );
}
