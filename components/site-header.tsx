import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { ThemeToggle } from "@/components/theme-toggle";

async function LogoutButton() {
  let session;
  try {
    session = await auth();
  } catch (e) {
    console.error("SiteHeader auth failed:", e);
    return (
      <Link className="rounded-md border px-3 py-2 text-sm" href="/login">
        Login
      </Link>
    );
  }
  if (!session?.user) {
    return (
      <Link className="rounded-md border px-3 py-2 text-sm" href="/login">
        Login
      </Link>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground" type="submit">
        Logout
      </button>
    </form>
  );
}

export async function SiteHeader() {
  let session;
  try {
    session = await auth();
  } catch (e) {
    console.error("SiteHeader auth failed:", e);
    session = null;
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link className="flex items-center gap-2 text-base font-black tracking-wide text-primary sm:text-lg" href="/">
          <Image
            src="/logo.png"
            alt="GALLE STAR CC logo"
            width={34}
            height={34}
            className="rounded-full border border-primary/30 object-cover"
          />
          <span>GALLE STAR CC</span>
        </Link>

        <nav className="hidden items-center gap-2 sm:gap-4 md:flex">
          {session?.user && (
            <>
              <Link className="text-sm hover:text-primary" href="/">Home</Link>
              <Link className="text-sm hover:text-primary" href="/dashboard">Dashboard</Link>
              <Link className="text-sm hover:text-primary" href="/teams">Teams</Link>
              <Link className="text-sm hover:text-primary" href="/matches">Matches</Link>
              <Link className="text-sm hover:text-primary" href="/practice">Practice</Link>
              {session.user.role === "admin" && (
                <Link className="text-sm hover:text-primary" href="/admin">Admin</Link>
              )}
            </>
          )}
          <ThemeToggle />
          <LogoutButton />
        </nav>

        <MobileNavMenu
          isAuthenticated={Boolean(session?.user)}
          isAdmin={session?.user?.role === "admin"}
        />
      </div>
    </header>
  );
}
