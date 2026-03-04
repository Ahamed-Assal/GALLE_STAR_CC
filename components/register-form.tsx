"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Could not register");
      return;
    }

    const signInRes = await signIn("credentials", {
      email: values.email.toLowerCase(),
      password: values.password,
      redirect: false,
    });

    if (signInRes?.error) {
      toast.error("Account created but login failed. Please try logging in.");
      router.push("/login");
      return;
    }

    toast.success("Account created");
    window.location.href = "/dashboard";
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
      <input {...form.register("name")} placeholder="Name" className="w-full rounded-md border px-3 py-2" />
      <input {...form.register("email")} type="email" placeholder="Email" className="w-full rounded-md border px-3 py-2" />
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
        {form.formState.isSubmitting ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
