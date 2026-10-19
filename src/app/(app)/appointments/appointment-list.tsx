"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  AppointmentAssigneeOption,
  AppointmentCardData,
  AppointmentServiceOption,
} from "./actions";
import { AppointmentCard } from "./appointment-card";
import { EditAppointmentModal } from "./edit-appointment-modal";

export type AppointmentTab = "upcoming" | "completed";

type AppointmentListProps = {
  activeTab: AppointmentTab;
  counts: { upcoming: number; completed: number };
  appointments: AppointmentCardData[];
  services: AppointmentServiceOption[];
  assignees: AppointmentAssigneeOption[];
};

function tabHref(tab: AppointmentTab): string {
  return tab === "completed" ? "/appointments?tab=completed" : "/appointments";
}

export function AppointmentList({
  activeTab,
  counts,
  appointments,
  services,
  assignees,
}: AppointmentListProps) {
  const [editing, setEditing] = useState<AppointmentCardData | null>(null);

  const tabButton = (tab: AppointmentTab, label: string, count: number) => {
    const isActive = activeTab === tab;
    return (
      <Link
        key={tab}
        href={tabHref(tab)}
        aria-current={isActive ? "page" : undefined}
        className={`flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all ${
          isActive
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
            : "text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        }`}
      >
        {label}
        <span
          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
            isActive
              ? "bg-white/20 text-white"
              : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
          }`}
        >
          {count}
        </span>
      </Link>
    );
  };

  return (
    <>
      <div
        role="tablist"
        aria-label="Appointment status"
        className="mb-6 flex gap-2 rounded-2xl border border-zinc-200 bg-zinc-100/70 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        {tabButton("upcoming", "Upcoming", counts.upcoming)}
        {tabButton("completed", "Completed", counts.completed)}
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-4 py-12 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {activeTab === "upcoming"
              ? "No upcoming appointments."
              : "No completed appointments yet."}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {activeTab === "upcoming" ? (
              <Link
                href="/appointments/new"
                className="font-semibold text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
              >
                Create one now
              </Link>
            ) : (
              "Finished appointments will appear here."
            )}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onEdit={setEditing}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditAppointmentModal
          appointment={editing}
          services={services}
          assignees={assignees}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
