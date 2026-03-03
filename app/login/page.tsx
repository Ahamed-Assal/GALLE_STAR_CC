import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-bold">Login</h1>
      <LoginForm />
      <p className="text-sm text-gray-500">
        New here? <Link href="/register" className="text-primary">Create an account</Link>
      </p>
    </div>
  );
}
