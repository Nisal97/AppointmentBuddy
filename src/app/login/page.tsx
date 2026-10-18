import type { Metadata } from "next";
import { login } from "../auth/actions";
import { AuthForm } from "../auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in | Appointment Buddy",
};

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />;
}
