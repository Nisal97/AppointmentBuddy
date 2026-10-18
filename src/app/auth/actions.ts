"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthState = {
  error?: string;
  message?: string;
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

function validate(email: string, password: string): string | null {
  if (!email || !password) return "Email and password are required.";
  if (!EMAIL_PATTERN.test(email)) return "Please enter a valid email address.";
  return null;
}

export async function login(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  const validationError = validate(email, password);
  if (validationError) return { error: validationError, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    switch (error.code) {
      case "invalid_credentials":
        return { error: "Incorrect email or password.", email };
      case "email_not_confirmed":
        return {
          error: "Please confirm your email address before signing in.",
          email,
        };
      default:
        return { error: error.message, email };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const shopName = String(formData.get("shopName") ?? "").trim();
  const ownerName = String(formData.get("ownerName") ?? "").trim();
  const contactInfo = String(formData.get("contactInfo") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (
    !shopName ||
    !ownerName ||
    !contactInfo ||
    !email ||
    !password ||
    !confirmPassword
  ) {
    return { error: "All fields are required.", email };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Please enter a valid email address.", email };
  }

  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return {
      error:
        "Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 symbol.",
      email,
    };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", email };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        shop_name: shopName,
        owner_name: ownerName,
        contact_info: contactInfo,
      },
    },
  });

  if (error) {
    switch (error.code) {
      case "user_already_exists":
      case "email_exists":
        return { error: "An account with this email already exists.", email };
      default:
        return { error: error.message, email };
    }
  }

  if (data.user && data.user.identities?.length === 0) {
    return { error: "An account with this email already exists.", email };
  }

  if (!data.session) {
    return {
      message: "Check your email for a confirmation link to finish signing up.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
