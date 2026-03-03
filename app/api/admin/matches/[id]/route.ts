import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/rbac";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireRoles(["admin"]);
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
