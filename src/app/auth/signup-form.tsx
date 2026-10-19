"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "./actions";
import type { AuthState } from "./actions";

const inputBase =
  "block w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-400/30";

const buttonBase =
  "w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/35 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signup,
    {},
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white mb-4 shadow-lg shadow-indigo-500/25">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Create an account
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Join Appointment Buddy today
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <form action={formAction} className="space-y-5" noValidate>
            <div>
              <label htmlFor="signupShopNameInput" id="signupShopNameLabel" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Shop Name
              </label>
              <input
                id="signupShopNameInput"
                name="shopName"
                type="text"
                autoComplete="shop-name"
                required
                disabled={isPending}
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="signupOwnerNameInput" id="signupOwnerNameLabel" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Shop Owner Name
              </label>
              <input
                id="signupOwnerNameInput"
                name="ownerName"
                type="text"
                autoComplete="name"
                required
                disabled={isPending}
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="signupContactInfoInput" id="signupContactInfoLabel" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Shop Contact Info
              </label>
              <input
                id="signupContactInfoInput"
                name="contactInfo"
                type="tel"
                autoComplete="tel"
                required
                disabled={isPending}
                className={inputBase}
              />
            </div>

            <div>
              <label htmlFor="signupEmailInput" id="signupEmailLabel" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                id="signupEmailInput"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                className={inputBase}
              />
            </div>

            <div className="relative">
              <label htmlFor="signupPasswordInput" id="signupPasswordLabel" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <input
                id="signupPasswordInput"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isPending}
                className={`${inputBase} pr-12`}
              />
              <button
                id="signupShowPasswordButton"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 transition"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="signupConfirmPasswordInput" id="signupConfirmPasswordLabel" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Retype Password
              </label>
              <input
                id="signupConfirmPasswordInput"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                disabled={isPending}
                className={`${inputBase} pr-12`}
              />
              <button
                id="signupShowConfirmPasswordButton"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isPending}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 transition"
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Password must be at least 8 characters with 1 uppercase letter, 1
              number, and 1 symbol.
            </p>

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
              id="signupSubmitButton"
              type="submit"
              disabled={isPending}
              className={buttonBase}
            >
              {isPending ? "Creating your account…" : "Sign up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
            >
              Sign in
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