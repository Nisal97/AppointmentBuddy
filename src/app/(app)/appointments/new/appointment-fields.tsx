import type {
  AppointmentAssigneeOption,
  AppointmentServiceOption,
} from "../actions";

type ServiceCheckboxesProps = {
  services: AppointmentServiceOption[];
  selectedIds: string[];
  isPending: boolean;
  onToggle: (id: string) => void;
};

export function ServiceCheckboxes({
  services,
  selectedIds,
  isPending,
  onToggle,
}: ServiceCheckboxesProps) {
  if (services.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No services yet. Add some from Edit Shop first.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {services.map((service) => {
        const checked = selectedIds.includes(service.id);
        return (
          <label
            key={service.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all ${
              checked
                ? "border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-500/10"
                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={isPending}
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
  );
}

type AssigneeSelectProps = {
  assignees: AppointmentAssigneeOption[];
  isPending: boolean;
};

const selectBase =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-400/30";

export function AssigneeSelect({ assignees, isPending }: AssigneeSelectProps) {
  return (
    <div>
      <label
        htmlFor="assigneeId"
        className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400"
      >
        Assignee{" "}
        <span className="text-zinc-400 dark:text-zinc-500">(optional)</span>
      </label>
      <select
        id="assigneeId"
        name="assigneeId"
        defaultValue=""
        disabled={isPending}
        className={selectBase}
      >
        <option value="">No preference</option>
        {assignees.map((assignee) => (
          <option key={assignee.id} value={assignee.id}>
            {assignee.name}
            {assignee.available_today ? "" : " (not available today)"}
          </option>
        ))}
      </select>
      {assignees.length === 0 && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          No staff yet — add assignees from Edit Shop.
        </p>
      )}
    </div>
  );
}
