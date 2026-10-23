"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  deleteAppointment,
  updateAppointment,
  type AppointmentAssigneeOption,
  type AppointmentCardData,
  type AppointmentServiceOption,
  type MutationState,
} from "./actions";
import { DeleteSection } from "./edit-appointment-delete";
import { EditFields } from "./edit-appointment-fields";
import { ReadOnlyDetails } from "./edit-appointment-readonly";

type EditAppointmentModalProps = {
  appointment: AppointmentCardData;
  services: AppointmentServiceOption[];
  assignees: AppointmentAssigneeOption[];
  onClose: () => void;
};

export function EditAppointmentModal({
  appointment,
  services,
  assignees,
  onClose,
}: EditAppointmentModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    appointment.services.map((s) => s.id),
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updateState, updateAction, isUpdating] = useActionState<
    MutationState,
    FormData
  >(updateAppointment, {});
  const [deleteState, deleteAction, isDeleting] = useActionState<
    MutationState,
    FormData
  >(deleteAppointment, {});

  useEffect(() => {
    if (updateState.message || deleteState.message) onClose();
  }, [updateState.message, deleteState.message, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const totalDuration = useMemo(
    () =>
      services
        .filter((service) => selectedIds.includes(service.id))
        .reduce((sum, service) => sum + service.duration_minutes, 0),
    [services, selectedIds],
  );

  const totalPrice = useMemo(
    () =>
      services
        .filter((service) => selectedIds.includes(service.id))
        .reduce((sum, service) => sum + service.cost, 0),
    [services, selectedIds],
  );

  const toggleService = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const submitUpdate = (formData: FormData) => {
    formData.set("appointmentId", appointment.id);
    formData.set("serviceIds", JSON.stringify(selectedIds));
    updateAction(formData);
  };

  const submitDelete = (formData: FormData) => {
    formData.set("appointmentId", appointment.id);
    deleteAction(formData);
  };

  const busy = isUpdating || isDeleting;
  const isCompleted = appointment.status === "completed";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isCompleted ? "Appointment details" : "Edit appointment"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white p-6 shadow-2xl sm:rounded-3xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {isCompleted ? "Appointment details" : "Edit appointment"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>
        <ModalBody
          appointment={appointment}
          services={services}
          assignees={assignees}
          selectedIds={selectedIds}
          totalDuration={totalDuration}
          totalPrice={totalPrice}
          busy={busy}
          isCompleted={isCompleted}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          confirmingDelete={confirmingDelete}
          updateError={updateState.error}
          deleteError={deleteState.error}
          onToggle={toggleService}
          onSubmitUpdate={submitUpdate}
          onSubmitDelete={submitDelete}
          onConfirmDelete={() => setConfirmingDelete(true)}
          onCancelDelete={() => setConfirmingDelete(false)}
        />
      </div>
    </div>
  );
}

function ModalBody({
  appointment,
  services,
  assignees,
  selectedIds,
  totalDuration,
  totalPrice,
  busy,
  isCompleted,
  isUpdating,
  isDeleting,
  confirmingDelete,
  updateError,
  deleteError,
  onToggle,
  onSubmitUpdate,
  onSubmitDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  appointment: AppointmentCardData;
  services: AppointmentServiceOption[];
  assignees: AppointmentAssigneeOption[];
  selectedIds: string[];
  totalDuration: number;
  totalPrice: number;
  busy: boolean;
  isCompleted: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  confirmingDelete: boolean;
  updateError?: string;
  deleteError?: string;
  onToggle: (id: string) => void;
  onSubmitUpdate: (formData: FormData) => void;
  onSubmitDelete: (formData: FormData) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <>
      {isCompleted ? (
        <ReadOnlyDetails appointment={appointment} />
      ) : (
        <form action={onSubmitUpdate} noValidate className="space-y-4">
          <EditFields
            appointment={appointment}
            services={services}
            assignees={assignees}
            selectedIds={selectedIds}
            totalDuration={totalDuration}
            totalPrice={totalPrice}
            busy={busy}
            onToggle={onToggle}
          />
          {updateError && (
            <p
              role="alert"
              className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
            >
              {updateError}
            </p>
          )}
          <button
            id="editAppointmentSaveButton"
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 active:scale-[0.98]"
          >
            {isUpdating ? "Saving…" : "Save changes"}
          </button>
        </form>
      )}
      <DeleteSection
        busy={busy}
        isDeleting={isDeleting}
        confirmingDelete={confirmingDelete}
        deleteError={deleteError}
        onSubmitDelete={onSubmitDelete}
        onConfirmDelete={onConfirmDelete}
        onCancelDelete={onCancelDelete}
      />
    </>
  );
}
