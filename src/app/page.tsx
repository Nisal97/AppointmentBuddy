import { login } from "./auth/actions";
import { AuthForm } from "./auth/auth-form";

export default function Home() {
  return <AuthForm mode="login" action={login} />;
}

