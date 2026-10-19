"use client";

type DeleteSectionProps = {
  busy: boolean;
  isDeleting: boolean;
  confirmingDelete: boolean;
  deleteError?: string;
  onSubmitDelete: (formData: FormData) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function DeleteSection({
  busy,
  isDeleting,
  confirmingDelete,
  deleteError,
  onSubmitDelete,
  onConfirmDelete,
  onCancelDelete,
}: DeleteSectionProps) {
  return (
    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      {confirmingDelete ? (
        <form action={onSubmitDelete} noValidate>
          <p className="mb-3 text-center text-sm text-zinc-600 dark:text-zinc-300">
            Delete this appointment? This can’t be undone.
          </p>
          {deleteError && (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            >
              {deleteError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onCancelDelete}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Keep
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/25 transition-all hover:bg-red-700 disabled:opacity-70 active:scale-[0.98]"
            >
              {isDeleting ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={onConfirmDelete}
          className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-all hover:bg-red-100 disabled:opacity-60 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/40"
        >
          Delete Appointment
        </button>
      )}
    </div>
  );
}
