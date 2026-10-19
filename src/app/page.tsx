import { login } from "./auth/actions";
import { AuthForm } from "./auth/auth-form";

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />;
}

