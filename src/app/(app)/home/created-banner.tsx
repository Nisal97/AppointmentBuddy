"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/** How long the confirmation banner stays visible after a successful redirect. */
const AUTO_DISMISS_MS = 4000;

export function CreatedBanner() {
  const searchParams = useSearchParams();
  const created = searchParams.get("created");

  const [visible, setVisible] = useState(() => created === "1");

  useEffect(() => {
    // Strip the ?created=1 query string on mount so a page refresh does not
    // re-trigger the success banner.
    if (created === "1" && typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Auto-dismiss the banner after 4 seconds.
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [created]);

  const handleClose = () => setVisible(false);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="mb-6 w-full rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
    >
      <div className="flex items-center justify-between">
        <p>Appointment created successfully.</p>
        <button
          type="button"
          aria-label="Dismiss appointment created notice"
          onClick={handleClose}
          className="inline-flex items-center rounded-md bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
