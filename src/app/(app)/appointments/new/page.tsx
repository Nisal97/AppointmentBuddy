import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import type {
  AppointmentAssigneeOption,
  AppointmentServiceOption,
} from "../actions";
import { AppointmentForm } from "./appointment-form";

export const metadata: Metadata = {
  title: "New Appointment | Appointment Buddy",
};

async function NewAppointmentContent() {
  // Same prerender opt-out as profile/shop: getUser() reads per-request
  // cookies and Supabase validates the JWT with an internal timestamp.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: services } = user
    ? await supabase
        .from("services")
        .select("id, name, duration_minutes, cost")
        .eq("shop_id", user.id)
        .order("created_at", { ascending: true })
    : { data: null };

  const { data: assignees } = user
    ? await supabase
        .from("assignees")
        .select("id, name, available_today")
        .eq("shop_id", user.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <AppointmentForm
      services={(services ?? []) as AppointmentServiceOption[]}
      assignees={(assignees ?? []) as AppointmentAssigneeOption[]}
    />
  );
}

export default function NewAppointmentPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          New Appointment
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Fill in the details and pick services
        </p>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <Suspense
          fallback={
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              Loading…
            </p>
          }
        >
          <NewAppointmentContent />
        </Suspense>
      </div>
    </div>
  );
}
