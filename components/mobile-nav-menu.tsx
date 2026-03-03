"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function MobileNavMenu({
  isAuthenticated,
  isAdmin,
}: {
  isAuthenticated: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-md border px-3 py-2 text-sm font-semibold"
      >
        Menu
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 space-y-2 rounded-xl border bg-white p-3 shadow-lg dark:bg-slate-900">
          {isAuthenticated ? (
            <>
              <Link onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-primary/10" href="/">Home</Link>
              <Link onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-primary/10" href="/dashboard">Dashboard</Link>
              <Link onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-primary/10" href="/teams">Teams</Link>
              <Link onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-primary/10" href="/matches">Matches</Link>
              <Link onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-primary/10" href="/practice">Practice</Link>
              {isAdmin && (
                <Link onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-primary/10" href="/admin">Admin</Link>
              )}
            </>
          ) : (
            <Link onClick={() => setOpen(false)} className="block rounded-md px-2 py-2 text-sm hover:bg-primary/10" href="/login">Login</Link>
          )}
          <div className="pt-1">
            <ThemeToggle />
          </div>
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </div>
  );
}
