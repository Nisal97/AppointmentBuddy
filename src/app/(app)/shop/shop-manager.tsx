"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveShop,
  type AssigneeRow,
  type ServiceRow,
  type ShopState,
} from "./actions";
import { AssigneeCard } from "./assignee-card";
import { saveButton, secondaryButton } from "./ui";
import { ServiceCard } from "./service-card";

function newService(): ServiceRow {
  return {
    id: `new-${crypto.randomUUID()}`,
    name: "",
    duration_minutes: 30,
    cost: 0,
    gender_specific: false,
    male_duration_minutes: null,
    male_cost: null,
    female_duration_minutes: null,
    female_cost: null,
  };
}

function newAssignee(): AssigneeRow {
  return { id: `new-${crypto.randomUUID()}`, name: "", available_today: true };
}

type ShopManagerProps = {
  initialServices: ServiceRow[];
  initialAssignees: AssigneeRow[];
};

export function ShopManager({ initialServices, initialAssignees }: ShopManagerProps) {
  const [activeTab, setActiveTab] = useState<"services" | "assignees">("services");
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [assignees, setAssignees] = useState<AssigneeRow[]>(initialAssignees);
  const [didDelete, setDidDelete] = useState<{
    services: string[];
    assignees: string[];
  }>({
    services: [],
    assignees: [],
  });
  const [state, formAction, isPending] = useActionState<ShopState, FormData>(
    saveShop,
    {},
  );
  const [isDirty, setIsDirty] = useState(false);
  // Transient copy of the save confirmation. Rendered instead of
  // `state.message` directly so the banner auto-dismisses after 5 seconds
  // and never reappears on revisit/reload (fresh mount => null).
  const [notice, setNotice] = useState<string | null>(null);

  // Sync client state with the DB after every load/save. Without this, rows
  // created by the last Save keep their temporary "new-*" ids, so the next
  // Save inserts them a second time instead of updating them.
  useEffect(() => {
    setServices(initialServices);
    setAssignees(initialAssignees);
    setDidDelete({ services: [], assignees: [] });
    setIsDirty(false);
  }, [initialServices, initialAssignees]);

  // Adopt the canonical rows returned by a successful Save immediately, so a
  // second Save right away updates instead of re-inserting new rows.
  useEffect(() => {
    if (state.savedServices) setServices(state.savedServices);
    if (state.savedAssignees) setAssignees(state.savedAssignees);
    if (state.savedServices || state.savedAssignees) {
      setDidDelete({ services: [], assignees: [] });
      setIsDirty(false);
    }
  }, [state.savedServices, state.savedAssignees]);

  // Show the save confirmation transiently: copy it into local state on
  // arrival, then clear after 5 seconds. Clearing local state (not the
  // action state) keeps the banner gone on revisit/reload while leaving
  // `state.message` untouched for tests/debugging.
  useEffect(() => {
    if (!state.message) return;
    setNotice(state.message);
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [state.message]);

  const markDirty = () => setIsDirty(true);

  const updateService = (id: string, patch: Partial<ServiceRow>) => {
    markDirty();
    setServices((prev) =>
      prev.map((service) => (service.id === id ? { ...service, ...patch } : service)),
    );
  };

  const removeService = (id: string) => {
    markDirty();
    setServices((prev) => prev.filter((service) => service.id !== id));
    if (!id.startsWith("new-")) {
      setDidDelete((prev) =>
        prev.services.includes(id)
          ? prev
          : { ...prev, services: [...prev.services, id] },
      );
    }
  };

  const updateAssignee = (id: string, patch: Partial<AssigneeRow>) => {
    markDirty();
    setAssignees((prev) =>
      prev.map((assignee) =>
        assignee.id === id ? { ...assignee, ...patch } : assignee,
      ),
    );
  };

  const removeAssignee = (id: string) => {
    markDirty();
    setAssignees((prev) => prev.filter((assignee) => assignee.id !== id));
    if (!id.startsWith("new-")) {
      setDidDelete((prev) =>
        prev.assignees.includes(id)
          ? prev
          : { ...prev, assignees: [...prev.assignees, id] },
      );
    }
  };

  const addService = () => {
    markDirty();
    setServices((prev) => [...prev, newService()]);
  };

  const addAssignee = () => {
    markDirty();
    setAssignees((prev) => [...prev, newAssignee()]);
  };

  const submitWithPayload = (formData: FormData) => {
    formData.set("services", JSON.stringify(services));
    formData.set("assignees", JSON.stringify(assignees));
    formData.set(
      "deletedServiceIds",
      JSON.stringify(didDelete.services.map((id) => ({ id }))),
    );
    formData.set(
      "deletedAssigneeIds",
      JSON.stringify(didDelete.assignees.map((id) => ({ id }))),
    );
    formAction(formData);
  };

  const tabButton = (tab: "services" | "assignees", label: string, count: number) => {
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={() => setActiveTab(tab)}
        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
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
      </button>
    );
  };

  return (
    <form action={submitWithPayload} noValidate>
      <div
        role="tablist"
        aria-label="Shop sections"
        className="mb-6 flex gap-2 rounded-2xl border border-zinc-200 bg-zinc-100/70 p-1.5 dark:border-zinc-800 dark:bg-zinc-900/60"
      >
        {tabButton("services", "Services", services.length)}
        {tabButton("assignees", "Assignees", assignees.length)}
      </div>

      {activeTab === "services" && (
        <section role="tabpanel" aria-label="Services" className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Services
            </h2>
            <button
              type="button"
              disabled={isPending}
              onClick={addService}
              className={secondaryButton}
            >
              + Add service
            </button>
          </div>

          <div className="space-y-4">
            {services.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No services yet. Click “Add service” to create one.
              </p>
            )}
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isPending={isPending}
                onUpdate={updateService}
                onRemove={removeService}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "assignees" && (
        <section role="tabpanel" aria-label="Assignees" className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Assignees
            </h2>
            <button
              type="button"
              disabled={isPending}
              onClick={addAssignee}
              className={secondaryButton}
            >
              + Add assignee
            </button>
          </div>

          <div className="space-y-4">
            {assignees.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No assignees yet. Click “Add assignee” to create one.
              </p>
            )}
            {assignees.map((assignee) => (
              <AssigneeCard
                key={assignee.id}
                assignee={assignee}
                isPending={isPending}
                onUpdate={updateAssignee}
                onRemove={removeAssignee}
              />
            ))}
          </div>
        </section>
      )}

      {state.error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
        >
          {notice}
        </p>
      )}

      {isDirty && !state.error && !notice && (
        <p className="mb-4 text-center text-xs font-medium text-amber-600 dark:text-amber-400">
          You have unsaved changes — don’t forget to hit Save.
        </p>
      )}

      <button type="submit" disabled={isPending} className={saveButton}>
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
