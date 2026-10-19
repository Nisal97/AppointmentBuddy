"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  cost: number;
  gender_specific: boolean;
  male_duration_minutes: number | null;
  male_cost: number | null;
  female_duration_minutes: number | null;
  female_cost: number | null;
};

export type AssigneeRow = {
  id: string;
  name: string;
  available_today: boolean;
};

export type ShopState = {
  error?: string;
  message?: string;
  savedServices?: ServiceRow[];
  savedAssignees?: AssigneeRow[];
};

function parsePayload<T>(formData: FormData, key: string): T[] | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

function toMoney(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
}

export async function saveShop(
  _prevState: ShopState,
  formData: FormData,
): Promise<ShopState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to update shop settings." };
  const shopId = user.id;

  // Self-heal: services.shop_id / assignees.shop_id reference
  // profiles(id). Users created before the migration ran (or where the
  // on_auth_user_created trigger didn't fire) have no profile row, which
  // causes "violates foreign key constraint services_shop_id_fkey".
  // Upserting only the id is a no-op for existing profiles.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: shopId }, { onConflict: "id" });
  if (profileError) return { error: profileError.message };

  const services = parsePayload<ServiceRow>(formData, "services");
  const assignees = parsePayload<AssigneeRow>(formData, "assignees");
  const deletedServiceIds = parsePayload<{ id: string }>(formData, "deletedServiceIds");
  const deletedAssigneeIds = parsePayload<{ id: string }>(
    formData,
    "deletedAssigneeIds",
  );
  if (!services || !assignees) return { error: "Invalid shop data submitted." };

  for (const service of services) {
    if (!service.name.trim()) return { error: "Every service needs a name." };
  }
  for (const assignee of assignees) {
    if (!assignee.name.trim()) return { error: "Every assignee needs a name." };
  }

  const buildServiceRow = (service: ServiceRow) => ({
    shop_id: shopId,
    name: service.name.trim(),
    duration_minutes: toInt(service.duration_minutes, 30),
    cost: toMoney(service.cost, 0),
    gender_specific: Boolean(service.gender_specific),
    male_duration_minutes: service.gender_specific
      ? toInt(service.male_duration_minutes ?? 30, 30)
      : null,
    male_cost: service.gender_specific
      ? toMoney(service.male_cost ?? 0, 0)
      : null,
    female_duration_minutes: service.gender_specific
      ? toInt(service.female_duration_minutes ?? 30, 30)
      : null,
    female_cost: service.gender_specific
      ? toMoney(service.female_cost ?? 0, 0)
      : null,
  });

  // NOTE: new and existing rows must be written separately. A single bulk
  // upsert mixing objects with and without `id` makes PostgREST fill the
  // missing key with NULL, which violates the not-null PK ("null value in
  // column id ... violates not-null constraint").
  const newServices = services.filter((service) =>
    service.id.startsWith("new-"),
  );
  const existingServices = services.filter(
    (service) => !service.id.startsWith("new-"),
  );

  if (newServices.length > 0) {
    const { error } = await supabase
      .from("services")
      .insert(newServices.map(buildServiceRow));
    if (error) return { error: error.message };
  }

  if (existingServices.length > 0) {
    const { error } = await supabase
      .from("services")
      .upsert(
        existingServices.map((service) => ({
          id: service.id,
          ...buildServiceRow(service),
        })),
        { onConflict: "id" },
      );
    if (error) return { error: error.message };
  }

  for (const deleted of deletedServiceIds ?? []) {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", deleted.id)
      .eq("shop_id", shopId);
    if (error) return { error: error.message };
  }

  const buildAssigneeRow = (assignee: AssigneeRow) => ({
    shop_id: shopId,
    name: assignee.name.trim(),
    available_today: Boolean(assignee.available_today),
  });

  // Same split as services: never mix id-less inserts with id-bearing
  // upserts in one call (PostgREST would NULL-fill the missing ids).
  const newAssignees = assignees.filter((assignee) =>
    assignee.id.startsWith("new-"),
  );
  const existingAssignees = assignees.filter(
    (assignee) => !assignee.id.startsWith("new-"),
  );

  if (newAssignees.length > 0) {
    const { error } = await supabase
      .from("assignees")
      .insert(newAssignees.map(buildAssigneeRow));
    if (error) return { error: error.message };
  }

  if (existingAssignees.length > 0) {
    const { error } = await supabase
      .from("assignees")
      .upsert(
        existingAssignees.map((assignee) => ({
          id: assignee.id,
          ...buildAssigneeRow(assignee),
        })),
        { onConflict: "id" },
      );
    if (error) return { error: error.message };
  }

  for (const deleted of deletedAssigneeIds ?? []) {
    const { error } = await supabase
      .from("assignees")
      .delete()
      .eq("id", deleted.id)
      .eq("shop_id", shopId);
    if (error) return { error: error.message };
  }

  revalidatePath("/shop");
  revalidatePath("/home", "layout");

  // Return the canonical rows (with real DB ids) so the client can drop its
  // temporary "new-*" ids immediately instead of waiting for revalidation.
  const { data: savedServices } = await supabase
    .from("services")
    .select(
      "id, name, duration_minutes, cost, gender_specific, male_duration_minutes, male_cost, female_duration_minutes, female_cost",
    )
    .eq("shop_id", shopId)
    .order("created_at", { ascending: true });
  const { data: savedAssignees } = await supabase
    .from("assignees")
    .select("id, name, available_today")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: true });

  return {
    message: "Shop settings saved.",
    savedServices: (savedServices ?? []) as ServiceRow[],
    savedAssignees: (savedAssignees ?? []) as AssigneeRow[],
  };
}
