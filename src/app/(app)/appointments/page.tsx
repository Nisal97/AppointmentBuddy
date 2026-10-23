import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import type {
  AppointmentAssigneeOption,
  AppointmentCardData,
  AppointmentServiceOption,
} from "./actions";
import { AppointmentList, type AppointmentTab } from "./appointment-list";

export const metadata: Metadata = {
  title: "Appointments | Appointment Buddy",
};

type RawAppointment = {
  id: string;
  customer_name: string | null;
  contact_number: string | null;
  appointment_date: string;
  appointment_time: string;
  total_duration_minutes: number | null;
  assignee_id: string | null;
  status: string;
  total_cost: number | null;
  assignees: { name: string } | { name: string }[] | null;
  appointment_services: { services: { id: string; name: string; duration_minutes: number } | null }[];
};

function assigneeName(
  value: RawAppointment["assignees"],
): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.name ?? null;
  return value.name ?? null;
}

async function AppointmentsContent({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const activeTab: AppointmentTab =
    params?.tab === "completed" ? "completed" : "upcoming";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        You must be signed in.
      </p>
    );
  }

  // Fetch only the rows for the active tab, plus a cheap count for the other
  // tab so both badge counts stay accurate without pulling every row.
  const otherTab: AppointmentTab =
    activeTab === "upcoming" ? "completed" : "upcoming";

  const { data: rows, count: activeCount } = await supabase
    .from("appointments")
    .select(
      "id, customer_name, contact_number, appointment_date, appointment_time, total_duration_minutes, assignee_id, status, total_cost, assignees(name), appointment_services(services(id, name, duration_minutes))",
      { count: "exact" },
    )
    .eq("shop_id", user.id)
    .eq("status", activeTab)
    .order("appointment_date", { ascending: activeTab === "upcoming" })
    .order("appointment_time", { ascending: activeTab === "upcoming" });

  const { count: otherCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", user.id)
    .eq("status", otherTab);

  const { data: services } = await supabase
    .from("services")
    .select(
      "id, name, duration_minutes, cost, gender_specific, male_duration_minutes, male_cost, female_duration_minutes, female_cost",
    )
    .eq("shop_id", user.id)
    .order("created_at", { ascending: true });

  const { data: assignees } = await supabase
    .from("assignees")
    .select("id, name, available_today")
    .eq("shop_id", user.id)
    .order("created_at", { ascending: true });

  const appointments: AppointmentCardData[] = ((rows ?? []) as unknown as RawAppointment[]).map(
    (row) => ({
      id: row.id,
      customer_name: row.customer_name ?? "",
      contact_number: row.contact_number ?? "",
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time,
      total_duration_minutes: row.total_duration_minutes ?? 0,
      assignee_id: row.assignee_id,
      assignee_name: assigneeName(row.assignees),
      status: row.status,
      total_cost: Number(row.total_cost ?? 0),
      services: row.appointment_services
        .map((link) => link.services)
        .filter((s): s is { id: string; name: string; duration_minutes: number } => Boolean(s)),
    }),
  );

  const counts =
    activeTab === "upcoming"
      ? { upcoming: activeCount ?? 0, completed: otherCount ?? 0 }
      : { upcoming: otherCount ?? 0, completed: activeCount ?? 0 };

  return (
    <AppointmentList
      activeTab={activeTab}
      counts={counts}
      appointments={appointments}
      services={(services ?? []) as AppointmentServiceOption[]}
      assignees={(assignees ?? []) as AppointmentAssigneeOption[]}
    />
  );
}

export default function AppointmentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Appointments
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Track upcoming visits and completed work
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Loading appointments…
          </p>
        }
      >
        <AppointmentsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
