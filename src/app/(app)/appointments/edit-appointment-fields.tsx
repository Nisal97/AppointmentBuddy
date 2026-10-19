import type {
  AppointmentAssigneeOption,
  AppointmentCardData,
  AppointmentServiceOption,
} from "./actions";

const inputBase =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-400/30";

const labelClass =
  "mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400";

export type ModalBodyShared = {
  appointment: AppointmentCardData;
  services: AppointmentServiceOption[];
  assignees: AppointmentAssigneeOption[];
  selectedIds: string[];
  totalDuration: number;
  busy: boolean;
  onToggle: (id: string) => void;
};

export function EditFields({
  appointment,
  services,
  assignees,
  selectedIds,
  totalDuration,
  busy,
  onToggle,
}: ModalBodyShared) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-customerName" className={labelClass}>
            Customer name
          </label>
          <input
            id="edit-customerName"
            name="customerName"
            type="text"
            defaultValue={appointment.customer_name}
            disabled={busy}
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="edit-contactNumber" className={labelClass}>
            Contact number <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-contactNumber"
            name="contactNumber"
            type="tel"
            inputMode="tel"
            required
            defaultValue={appointment.contact_number}
            disabled={busy}
            className={inputBase}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-appointmentDate" className={labelClass}>
            Date <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-appointmentDate"
            name="appointmentDate"
            type="date"
            required
            defaultValue={appointment.appointment_date}
            disabled={busy}
            className={inputBase}
          />
        </div>
        <div>
          <label htmlFor="edit-appointmentTime" className={labelClass}>
            Time <span className="text-red-500">*</span>
          </label>
          <input
            id="edit-appointmentTime"
            name="appointmentTime"
            type="time"
            required
            step={300}
            defaultValue={appointment.appointment_time.slice(0, 5)}
            disabled={busy}
            className={inputBase}
          />
        </div>
      </div>
      <fieldset>
        <legend className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Services <span className="text-red-500">*</span>
        </legend>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {services.map((service) => {
            const checked = selectedIds.includes(service.id);
            return (
              <label
                key={service.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                  checked
                    ? "border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10"
                    : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={busy}
                  onChange={() => onToggle(service.id)}
                  className="h-4 w-4 shrink-0 accent-indigo-600"
                />
                <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-100">
                  {service.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {service.duration_minutes} min
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <p className="text-right text-sm font-semibold text-indigo-700 dark:text-indigo-300">
        Total: {totalDuration} min
      </p>
      <div>
        <label htmlFor="edit-assigneeId" className={labelClass}>
          Assignee
        </label>
        <select
          id="edit-assigneeId"
          name="assigneeId"
          defaultValue={appointment.assignee_id ?? ""}
          disabled={busy}
          className={inputBase}
        >
          <option value="">No preference</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
              {assignee.available_today ? "" : " (not available today)"}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
