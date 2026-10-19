import type { AppointmentCardData } from "./actions";
import { formatDate, formatTime } from "./format";
import { formatMoney } from "./gender";

type ReadOnlyDetailsProps = {
  appointment: AppointmentCardData;
};

/**
 * Read-only summary shown in the modal once an appointment is completed —
 * details stay viewable and deletable, but the edit form is not rendered.
 */
export function ReadOnlyDetails({ appointment }: ReadOnlyDetailsProps) {
  const rows: { label: string; value: string }[] = [
    {
      label: "Customer",
      value: appointment.customer_name || "Walk-in customer",
    },
    { label: "Contact", value: appointment.contact_number || "—" },
    {
      label: "Gender",
      value: appointment.gender === "female" ? "Female" : "Male",
    },
    { label: "Date", value: formatDate(appointment.appointment_date) },
    {
      label: "Time",
      value: formatTime(appointment.appointment_time.slice(0, 5)),
    },
    { label: "Duration", value: `${appointment.total_duration_minutes} min` },
    { label: "Price", value: formatMoney(appointment.total_cost) },
    { label: "Assignee", value: appointment.assignee_name ?? "No preference" },
  ];

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
        This appointment is completed and can no longer be edited.
      </p>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">
              {row.label}
            </dt>
            <dd className="break-words font-medium text-zinc-900 dark:text-zinc-100">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Services
        </p>
        <div className="flex flex-wrap gap-1.5">
          {appointment.services.map((service) => (
            <span
              key={service.id}
              className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
            >
              {service.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}