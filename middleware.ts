import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const roleRequired: Record<string, string[]> = {
  "/admin": ["admin"],
  "/dashboard": ["admin", "team_owner", "scorer", "public"],
  "/teams": ["admin", "team_owner", "scorer", "public"],
};

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const protectedPath = Object.keys(roleRequired).find((prefix) =>
    path.startsWith(prefix),
  );

  if (path.startsWith("/practice")) {
    return NextResponse.next();
  }

  if (path.startsWith("/matches/") && request.nextUrl.searchParams.get("practice") === "1") {
    return NextResponse.next();
  }

  if (path === "/matches" || path.startsWith("/matches/")) {
    return NextResponse.next();
  }

  if (!protectedPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = (token.role as string) ?? "public";
  const allowedRoles = roleRequired[protectedPath];
  if (!allowedRoles.includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/teams/:path*", "/matches/:path*", "/practice/:path*", "/admin/:path*"],
};
