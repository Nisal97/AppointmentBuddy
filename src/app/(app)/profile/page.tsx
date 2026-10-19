import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Edit Profile | Appointment Buddy",
};

async function ProfileContent() {
  // Opts this component out of prerendering: getUser() reads per-request
  // cookies, and Supabase validates the JWT with an internal timestamp that
  // Next flags as an unstable value during static prerender.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("shop_name").eq("id", user.id).single()
    : { data: null };
  const shopName =
    profile?.shop_name ??
    (user?.user_metadata?.shop_name as string | undefined) ??
    "";

  return (
    <ProfileForm initialShopName={shopName} initialEmail={user?.email ?? ""} />
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Edit Profile
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Update your shop details and sign-in credentials
        </p>
      </div>

      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Loading profile…
          </p>
        }
      >
        <ProfileContent />
      </Suspense>
    </div>
  );
}
