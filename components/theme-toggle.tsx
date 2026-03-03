"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-md border border-primary/30 px-3 py-2 text-sm font-medium hover:bg-primary/10"
    >
      {isDark ? "Light" : "Dark"} mode
    </button>
  );
}
