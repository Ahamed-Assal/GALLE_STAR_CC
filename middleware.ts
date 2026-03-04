import { NextResponse } from "next/server";
import { auth } from "@/auth";

const roleRequired: Record<string, string[]> = {
  "/admin": ["admin"],
  "/dashboard": ["admin", "team_owner", "scorer", "public"],
  "/teams": ["admin", "team_owner", "scorer", "public"],
};

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const path = nextUrl.pathname;

  const protectedPath = Object.keys(roleRequired).find((prefix) =>
    path.startsWith(prefix),
  );

  if (path.startsWith("/practice")) {
    return NextResponse.next();
  }

  if (path.startsWith("/matches/") && nextUrl.searchParams.get("practice") === "1") {
    return NextResponse.next();
  }

  if (path === "/matches" || path.startsWith("/matches/")) {
    return NextResponse.next();
  }

  if (!protectedPath) {
    return NextResponse.next();
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const allowedRoles = roleRequired[protectedPath];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/teams/:path*", "/matches/:path*", "/practice/:path*", "/admin/:path*"],
};
