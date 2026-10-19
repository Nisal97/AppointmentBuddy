"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  normalizeGender,
  serviceCost,
  serviceDurationMinutes,
  type AppointmentGender,
  type GenderedService,
} from "./gender";

export type AppointmentServiceOption = GenderedService & {
  id: string;
  name: string;
};

export type AppointmentAssigneeOption = {
  id: string;
  name: string;
  available_today: boolean;
};

export type AppointmentState = {
  error?: string;
  /** Set on success so the home page can show a one-time confirmation. */
  created?: boolean;
};

export type AppointmentCardData = {
  id: string;
  customer_name: string;
  contact_number: string;
  appointment_date: string;
  appointment_time: string;
  total_duration_minutes: number;
  assignee_id: string | null;
  assignee_name: string | null;
  status: string;
  gender: AppointmentGender;
  total_cost: number;
  services: { id: string; name: string; duration_minutes: number }[];
};

export type MutationState = {
  error?: string;
  message?: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function createAppointment(
  _prevState: AppointmentState,
  formData: FormData,
): Promise<AppointmentState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to create appointments." };
  const shopId = user.id;

  const customerName = String(formData.get("customerName") ?? "").trim();
  const contactNumber = String(formData.get("contactNumber") ?? "").trim();
  const appointmentDate = String(formData.get("appointmentDate") ?? "").trim();
  const appointmentTime = String(formData.get("appointmentTime") ?? "").trim();
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "").trim();
  const gender = normalizeGender(formData.get("gender"));

  let serviceIds: string[] = [];
  try {
    const raw = formData.get("serviceIds");
    const parsed: unknown =
      typeof raw === "string" ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      serviceIds = parsed.filter((id): id is string => typeof id === "string");
    }
  } catch {
    return { error: "Invalid services submitted." };
  }

  if (!contactNumber) return { error: "Contact number is required." };
  if (!DATE_PATTERN.test(appointmentDate)) {
    return { error: "Please choose a valid appointment date." };
  }
  if (!TIME_PATTERN.test(appointmentTime)) {
    return { error: "Please choose a valid appointment time." };
  }
  // Snap to 5-minute intervals: minutes must be a multiple of 5.
  const minutes = Number(appointmentTime.slice(3, 5));
  if (!Number.isInteger(minutes) || minutes % 5 !== 0) {
    return { error: "Please choose a time in 5-minute intervals." };
  }
  if (serviceIds.length === 0) {
    return { error: "Please select at least one service." };
  }

  // Self-heal the parent profile row (same pattern as saveShop).
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: shopId }, { onConflict: "id" });
  if (profileError) return { error: profileError.message };

  // Re-resolve selected services server-side so duration/total can't be
  // forged from the client — only rows belonging to this shop count.
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, duration_minutes, cost, gender_specific, male_duration_minutes, male_cost, female_duration_minutes, female_cost",
    )
    .eq("shop_id", shopId)
    .in("id", serviceIds);
  if (servicesError) return { error: servicesError.message };
  if (!services || services.length !== serviceIds.length) {
    return { error: "One or more selected services are invalid." };
  }
  const totalDuration = services.reduce(
    (sum, s) => sum + serviceDurationMinutes(s, gender),
    0,
  );
  const totalCost = services.reduce((sum, s) => sum + serviceCost(s, gender), 0);

  // Validate the assignee (optional): must belong to this shop.
  let assigneeId: string | null = null;
  if (assigneeIdRaw) {
    const { data: assignee, error: assigneeError } = await supabase
      .from("assignees")
      .select("id")
      .eq("shop_id", shopId)
      .eq("id", assigneeIdRaw)
      .single();
    if (assigneeError || !assignee) {
      return { error: "Selected assignee is invalid." };
    }
    assigneeId = assignee.id;
  }

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      shop_id: shopId,
      customer_name: customerName,
      contact_number: contactNumber,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      total_duration_minutes: totalDuration,
      total_cost: totalCost,
      gender,
      assignee_id: assigneeId,
      status: "upcoming",
    })
    .select("id")
    .single();
  if (insertError || !appointment) {
    return { error: insertError?.message ?? "Could not save the appointment." };
  }

  const { error: linkError } = await supabase
    .from("appointment_services")
    .insert(
      serviceIds.map((service_id) => ({
        appointment_id: appointment.id,
        service_id,
      })),
    );
  if (linkError) {
    // Roll back the orphaned appointment so a partial save never lingers.
    await supabase
      .from("appointments")
      .delete()
      .eq("id", appointment.id)
      .eq("shop_id", shopId);
    return { error: linkError.message };
  }

  revalidatePath("/home", "layout");
  redirect("/home?created=1");
}

async function requireShop() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, shopId: null as string | null };
  return { supabase, shopId: user.id };
}

function readServiceIds(formData: FormData): string[] | null {
  try {
    const raw = formData.get("serviceIds");
    const parsed: unknown = typeof raw === "string" ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return null;
  }
}

function validateDateTime(
  appointmentDate: string,
  appointmentTime: string,
): string | null {
  if (!DATE_PATTERN.test(appointmentDate)) {
    return "Please choose a valid appointment date.";
  }
  if (!TIME_PATTERN.test(appointmentTime)) {
    return "Please choose a valid appointment time.";
  }
  const minutes = Number(appointmentTime.slice(3, 5));
  if (!Number.isInteger(minutes) || minutes % 5 !== 0) {
    return "Please choose a time in 5-minute intervals.";
  }
  return null;
}

/** Marks an upcoming appointment as completed. Bound to the "Done" button. */
export async function completeAppointment(
  _prevState: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const { supabase, shopId } = await requireShop();
  if (!shopId) return { error: "You must be signed in." };

  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  if (!appointmentId) return { error: "Missing appointment." };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId)
    .eq("shop_id", shopId)
    .eq("status", "upcoming");
  if (error) return { error: error.message };

  revalidatePath("/appointments");
  revalidatePath("/home", "layout");
  return { message: "Appointment marked as done." };
}

/** Updates an appointment's details and linked services from the edit modal. */
export async function updateAppointment(
  _prevState: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const { supabase, shopId } = await requireShop();
  if (!shopId) return { error: "You must be signed in." };

  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const contactNumber = String(formData.get("contactNumber") ?? "").trim();
  const appointmentDate = String(formData.get("appointmentDate") ?? "").trim();
  const appointmentTime = String(formData.get("appointmentTime") ?? "").trim();
  const assigneeIdRaw = String(formData.get("assigneeId") ?? "").trim();
  const gender = normalizeGender(formData.get("gender"));
  const serviceIds = readServiceIds(formData);

  if (!appointmentId) return { error: "Missing appointment." };
  if (!contactNumber) return { error: "Contact number is required." };
  const dateTimeError = validateDateTime(appointmentDate, appointmentTime);
  if (dateTimeError) return { error: dateTimeError };
  if (!serviceIds || serviceIds.length === 0) {
    return { error: "Please select at least one service." };
  }

  // Completed appointments are read-only: reject edits server-side even if a
  // client bypasses the UI guard.
  const { data: existing, error: existingError } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", appointmentId)
    .eq("shop_id", shopId)
    .maybeSingle();
  if (existingError) return { error: existingError.message };
  if (!existing) return { error: "Appointment not found." };
  if (existing.status === "completed") {
    return { error: "Completed appointments can no longer be edited." };
  }

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select(
      "id, duration_minutes, cost, gender_specific, male_duration_minutes, male_cost, female_duration_minutes, female_cost",
    )
    .eq("shop_id", shopId)
    .in("id", serviceIds);
  if (servicesError) return { error: servicesError.message };
  if (!services || services.length !== serviceIds.length) {
    return { error: "One or more selected services are invalid." };
  }
  const totalDuration = services.reduce(
    (sum, s) => sum + serviceDurationMinutes(s, gender),
    0,
  );
  const totalCost = services.reduce((sum, s) => sum + serviceCost(s, gender), 0);

  let assigneeId: string | null = null;
  if (assigneeIdRaw) {
    const { data: assignee } = await supabase
      .from("assignees")
      .select("id")
      .eq("shop_id", shopId)
      .eq("id", assigneeIdRaw)
      .single();
    if (!assignee) return { error: "Selected assignee is invalid." };
    assigneeId = assignee.id;
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("appointments")
    .update({
      customer_name: customerName,
      contact_number: contactNumber,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      total_duration_minutes: totalDuration,
      total_cost: totalCost,
      gender,
      assignee_id: assigneeId,
    })
    .eq("id", appointmentId)
    .eq("shop_id", shopId)
    .neq("status", "completed")
    .select("id");
  if (updateError) return { error: updateError.message };
  // Zero rows means the appointment was completed (or removed) while the
  // modal was open — bail before rewriting the service links.
  if (!updatedRows || updatedRows.length === 0) {
    return {
      error:
        "This appointment could not be updated — it may have been completed or deleted.",
    };
  }

  const { error: deleteLinksError } = await supabase
    .from("appointment_services")
    .delete()
    .eq("appointment_id", appointmentId);
  if (deleteLinksError) return { error: deleteLinksError.message };

  const { error: linkError } = await supabase
    .from("appointment_services")
    .insert(
      serviceIds.map((service_id) => ({
        appointment_id: appointmentId,
        service_id,
      })),
    );
  if (linkError) return { error: linkError.message };

  revalidatePath("/appointments");
  revalidatePath("/home", "layout");
  return { message: "Appointment updated." };
}

/** Deletes an appointment (junction rows cascade). Bound to the modal delete. */
export async function deleteAppointment(
  _prevState: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const { supabase, shopId } = await requireShop();
  if (!shopId) return { error: "You must be signed in." };

  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  if (!appointmentId) return { error: "Missing appointment." };

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("shop_id", shopId);
  if (error) return { error: error.message };

  revalidatePath("/appointments");
  revalidatePath("/home", "layout");
  return { message: "Appointment deleted." };
}
