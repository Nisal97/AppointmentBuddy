"use client";

import type { AssigneeRow } from "./actions";
import { card, dangerButton, inputBase, labelClass, Toggle } from "./ui";

type AssigneeCardProps = {
  assignee: AssigneeRow;
  isPending: boolean;
  onUpdate: (id: string, patch: Partial<AssigneeRow>) => void;
  onRemove: (id: string) => void;
};

export function AssigneeCard({ assignee, isPending, onUpdate, onRemove }: AssigneeCardProps) {
  return (
    <div className={card}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={assignee.name}
            disabled={isPending}
            onChange={(e) => onUpdate(assignee.id, { name: e.target.value })}
            placeholder="e.g. John the barber"
            className={inputBase}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onRemove(assignee.id)}
            className={dangerButton}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Available Today
        </span>
        <Toggle
          checked={assignee.available_today}
          disabled={isPending}
          label="Available Today"
          colorOn="bg-emerald-500"
          onToggle={() =>
            onUpdate(assignee.id, { available_today: !assignee.available_today })
          }
        />
      </div>
    </div>
  );
}
