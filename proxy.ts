import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy allows all matched routes through. Auth is enforced in page-level auth()
 * because getToken in Edge doesn't reliably read the session cookie on Vercel.
 */
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/teams/:path*", "/matches/:path*", "/practice/:path*", "/admin/:path*"],
};
