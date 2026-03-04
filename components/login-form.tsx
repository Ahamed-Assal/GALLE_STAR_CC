"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    if (res?.error) {
      toast.error("Invalid credentials");
      return;
    }

    toast.success("Welcome back");
    // Use redirect so session cookie is set before navigation
    window.location.href = "/dashboard";
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
      <input
        {...form.register("email")}
        type="email"
        placeholder="Email"
        className="w-full rounded-md border px-3 py-2"
      />
      <input
        {...form.register("password")}
        type="password"
        placeholder="Password"
        className="w-full rounded-md border px-3 py-2"
      />
      <button
        disabled={form.formState.isSubmitting}
        className="w-full rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground"
        type="submit"
      >
        {form.formState.isSubmitting ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
