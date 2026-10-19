"use client";

import type { ServiceRow } from "./actions";
import { GenderPricing } from "./gender-pricing";
import { card, dangerButton, inputBase, labelClass, Toggle } from "./ui";

type ServiceCardProps = {
  service: ServiceRow;
  isPending: boolean;
  onUpdate: (id: string, patch: Partial<ServiceRow>) => void;
  onRemove: (id: string) => void;
};

export function ServiceCard({ service, isPending, onUpdate, onRemove }: ServiceCardProps) {
  return (
    <div className={card}>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label className={labelClass}>Name</label>
          <input
            type="text"
            value={service.name}
            disabled={isPending}
            onChange={(e) => onUpdate(service.id, { name: e.target.value })}
            placeholder="e.g. Haircut"
            className={inputBase}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => onRemove(service.id)}
            className={dangerButton}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Gender-Specific
        </span>
        <Toggle
          checked={service.gender_specific}
          disabled={isPending}
          label="Gender-Specific"
          colorOn="bg-indigo-600"
          onToggle={() =>
            onUpdate(service.id, {
              gender_specific: !service.gender_specific,
              male_duration_minutes:
                service.male_duration_minutes ?? service.duration_minutes,
              male_cost: service.male_cost ?? service.cost,
              female_duration_minutes:
                service.female_duration_minutes ?? service.duration_minutes,
              female_cost: service.female_cost ?? service.cost,
            })
          }
        />
      </div>

      {!service.gender_specific ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Duration (minutes)</label>
            <input
              type="number"
              min={0}
              value={service.duration_minutes}
              disabled={isPending}
              onChange={(e) =>
                onUpdate(service.id, { duration_minutes: Number(e.target.value) })
              }
              className={inputBase}
            />
          </div>
          <div>
            <label className={labelClass}>Cost</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={service.cost}
              disabled={isPending}
              onChange={(e) => onUpdate(service.id, { cost: Number(e.target.value) })}
              className={inputBase}
            />
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <GenderPricing
            tone="male"
            duration={service.male_duration_minutes}
            cost={service.male_cost}
            isPending={isPending}
            onDuration={(value) =>
              onUpdate(service.id, { male_duration_minutes: value })
            }
            onCost={(value) => onUpdate(service.id, { male_cost: value })}
          />
          <GenderPricing
            tone="female"
            duration={service.female_duration_minutes}
            cost={service.female_cost}
            isPending={isPending}
            onDuration={(value) =>
              onUpdate(service.id, { female_duration_minutes: value })
            }
            onCost={(value) => onUpdate(service.id, { female_cost: value })}
          />
        </div>
      )}
    </div>
  );
}
