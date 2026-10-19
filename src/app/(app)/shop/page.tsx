import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import type { AssigneeRow, ServiceRow } from "./actions";
import { ShopManager } from "./shop-manager";

export const metadata: Metadata = {
  title: "Edit Shop | Appointment Buddy",
};

async function ShopContent() {
  // Opts this component out of prerendering: getUser() reads per-request
  // cookies, and Supabase validates the JWT with an internal timestamp that
  // Next flags as an unstable value during static prerender.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: services } = user
    ? await supabase
        .from("services")
        .select(
          "id, name, duration_minutes, cost, gender_specific, male_duration_minutes, male_cost, female_duration_minutes, female_cost",
        )
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
    <ShopManager
      initialServices={(services ?? []) as ServiceRow[]}
      initialAssignees={(assignees ?? []) as AssigneeRow[]}
    />
  );
}

export default function ShopPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Edit Shop
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Manage your services and assignees
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Loading shop…
          </p>
        }
      >
        <ShopContent />
      </Suspense>
    </div>
  );
}
