"use client";

import { inputBase, labelClass } from "./ui";

type GenderPricingProps = {
  tone: "male" | "female";
  duration: number | null;
  cost: number | null;
  isPending: boolean;
  onDuration: (value: number) => void;
  onCost: (value: number) => void;
};

export function GenderPricing({
  tone,
  duration,
  cost,
  isPending,
  onDuration,
  onCost,
}: GenderPricingProps) {
  const isMale = tone === "male";
  return (
    <div
      className={
        isMale
          ? "rounded-xl bg-indigo-50 p-3 dark:bg-indigo-950/40"
          : "rounded-xl bg-pink-50 p-3 dark:bg-pink-950/40"
      }
    >
      <p
        className={
          isMale
            ? "mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300"
            : "mb-2 text-xs font-semibold uppercase tracking-wide text-pink-700 dark:text-pink-300"
        }
      >
        {isMale ? "Male" : "Female"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Duration (minutes)</label>
          <input
            type="number"
            min={0}
            value={duration ?? ""}
            disabled={isPending}
            onChange={(e) => onDuration(Number(e.target.value))}
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelClass}>Cost</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={cost ?? ""}
            disabled={isPending}
            onChange={(e) => onCost(Number(e.target.value))}
            className={inputBase}
          />
        </div>
      </div>
    </div>
  );
}
