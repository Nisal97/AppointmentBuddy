import type { Metadata } from "next";
import { SignupForm } from "../auth/signup-form";

export const metadata: Metadata = {
  title: "Sign up | Appointment Buddy",
};

export default function SignupPage() {
  return <SignupForm />;
}
