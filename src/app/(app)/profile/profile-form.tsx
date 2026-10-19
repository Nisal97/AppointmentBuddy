"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, type ProfileState } from "./actions";

const inputBase =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-400/30";

const buttonBase =
  "w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/35 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]";

type ProfileFormProps = {
  initialShopName: string;
  initialEmail: string;
};

export function ProfileForm({ initialShopName, initialEmail }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {},
  );
  // Transient copy of the save confirmation. Rendered instead of
  // `state.message` directly so the banner auto-dismisses after 3 seconds
  // and never reappears on revisit/reload (fresh mount => null).
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!state.message) return;
    setNotice(state.message);
    const timer = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(timer);
  }, [state.message]);

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
      <form action={formAction} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="shopName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Shop Name
          </label>
          <input
            id="shopName"
            name="shopName"
            type="text"
            defaultValue={initialShopName}
            required
            disabled={isPending}
            className={inputBase}
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={initialEmail}
            required
            disabled={isPending}
            className={inputBase}
          />
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            New Password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep current password"
            disabled={isPending}
            className={inputBase}
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          >
            {state.error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
          >
            {notice}
          </p>
        )}

        <button type="submit" disabled={isPending} className={buttonBase}>
          {isPending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
