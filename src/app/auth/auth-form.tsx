"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "./actions";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
};

const COPY = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to continue to Appointment Buddy",
    submit: "Sign in",
    pending: "Signing in…",
    altText: "Don't have an account?",
    altLink: "/signup",
    altLabel: "Create an account",
    passwordAutocomplete: "current-password",
  },
  signup: {
    title: "Create an account",
    subtitle: "Join Appointment Buddy today",
    submit: "Sign up",
    pending: "Creating your account…",
    altText: "Already have an account?",
    altLink: "/login",
    altLabel: "Sign in",
    passwordAutocomplete: "new-password",
  },
} as const;

const inputBase =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-400/30";

const buttonBase =
  "w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/35 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]";

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    action,
    {},
  );
  const copy = COPY[mode];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {copy.title}
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">{copy.subtitle}</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <form action={formAction} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                disabled={isPending}
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={copy.passwordAutocomplete}
                required
                disabled={isPending}
                className={inputBase}
              />
            </div>

            {state.error && (
              <p role="alert" className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                {state.error}
              </p>
            )}

            {state.message && (
              <p role="status" className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300">
                {state.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={buttonBase}
            >
              {isPending ? copy.pending : copy.submit}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {copy.altText}{" "}
            <Link
              href={copy.altLink}
              className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
            >
              {copy.altLabel}
            </Link>
          </p>
        </div>

        <p className="mt-10 text-center text-xs text-zinc-400 dark:text-zinc-500">
          © 2026 Appointment Buddy
        </p>
      </div>
    </div>
  );
}

