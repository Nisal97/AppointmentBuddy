import Link from "next/link";
import { Suspense } from "react";

async function CreatedBanner({
  searchParams,
}: {
  searchParams?: Promise<{ created?: string }>;
}) {
  const params = await searchParams;
  if (params?.created !== "1") return null;
  return (
    <p
      role="status"
      className="mb-6 w-full rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
    >
      Appointment created successfully.
    </p>
  );
}

export default function Home({
  searchParams,
}: {
  searchParams?: Promise<{ created?: string }>;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-12">
      <Suspense fallback={null}>
        <CreatedBanner searchParams={searchParams} />
      </Suspense>

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Welcome back
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-zinc-500 dark:text-zinc-400">
          Book appointments and manage your shop from here.
        </p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link
          href="/appointments/new"
          className="group flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-left text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/35 active:scale-[0.99] sm:p-6"
        >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 sm:h-14 sm:w-14">
          <svg
            className="h-6 w-6 sm:h-7 sm:w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block text-base font-bold sm:text-lg">
            Create Appointment
          </span>
          <span className="block text-xs text-indigo-100 sm:text-sm">
            Book a customer in seconds
          </span>
        </span>
        <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span>
        </Link>

        <Link
          href="/appointments"
          className="group flex w-full items-center gap-4 rounded-2xl border border-indigo-100 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.99] sm:p-6 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-black/40"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25 sm:h-14 sm:w-14">
            <svg
              className="h-6 w-6 sm:h-7 sm:w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block text-base font-bold text-zinc-900 sm:text-lg dark:text-white">
              Appointments
            </span>
            <span className="block text-xs text-zinc-500 sm:text-sm dark:text-zinc-400">
              View upcoming & completed
            </span>
          </span>
          <span aria-hidden="true" className="text-xl text-zinc-400 transition-transform group-hover:translate-x-1 dark:text-zinc-500">→</span>
        </Link>
      </div>
    </div>
  );
}