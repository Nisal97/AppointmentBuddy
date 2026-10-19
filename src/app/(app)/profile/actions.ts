"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export type ProfileState = {
  error?: string;
  message?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, userId: null as string | null };
  return { supabase, userId: user.id };
}

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const { supabase, userId } = await requireUserId();
  if (!userId) return { error: "You must be signed in to update your profile." };

  const shopName = String(formData.get("shopName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!shopName || !email) {
    return { error: "Shop name and email are required." };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (newPassword && newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const authUpdates: { email?: string; password?: string } = {};
  if (email) authUpdates.email = email;
  if (newPassword) authUpdates.password = newPassword;
  const { error: authError } = await supabase.auth.updateUser(authUpdates);
  if (authError) return { error: authError.message };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, shop_name: shopName }, { onConflict: "id" });
  if (profileError) return { error: profileError.message };

  revalidatePath("/profile");
  revalidatePath("/home", "layout");
  return { message: "Profile saved." };
}
