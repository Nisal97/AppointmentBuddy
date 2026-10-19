import type { AppointmentGender } from "./gender";

type GenderToggleProps = {
  gender: AppointmentGender;
  id: string;
  isPending: boolean;
  onGenderChange: (gender: AppointmentGender) => void;
};

/**
 * Male ⇄ Female switch for the customer (default Male). Also renders a hidden
 * input so the selected gender submits with its form.
 */
export function GenderToggle({
  gender,
  id,
  isPending,
  onGenderChange,
}: GenderToggleProps) {
  const isFemale = gender === "female";
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Customer gender
        </p>
        <p
          className={`text-sm font-semibold ${
            isFemale
              ? "text-pink-700 dark:text-pink-300"
              : "text-indigo-700 dark:text-indigo-300"
          }`}
        >
          {isFemale ? "Female" : "Male"}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Uses gender-specific duration &amp; price where configured
        </p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isFemale}
        aria-label="Toggle female customer"
        disabled={isPending}
        onClick={() => onGenderChange(isFemale ? "male" : "female")}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:opacity-60 ${
          isFemale
            ? "bg-pink-600 dark:bg-pink-500"
            : "bg-indigo-600 dark:bg-indigo-500"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            isFemale ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <input type="hidden" name="gender" value={gender} />
    </div>
  );
}