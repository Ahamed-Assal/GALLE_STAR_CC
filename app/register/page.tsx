import Link from "next/link";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-10">
      <h1 className="text-2xl font-bold">Register</h1>
      <RegisterForm />
      <p className="text-sm text-gray-500">
        Already have an account? <Link href="/login" className="text-primary">Login</Link>
      </p>
    </div>
  );
}
