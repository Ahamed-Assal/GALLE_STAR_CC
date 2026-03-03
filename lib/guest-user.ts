import { prisma } from "@/lib/prisma";

const PRACTICE_GUEST_EMAIL = "practice.guest@gallestarcc.local";
const PRACTICE_GUEST_HASH = "$2b$10$t9vprUpYJNhy2qMGKZGgR.qS3z/bATh1TwdYEXzG6T2yhEpjSZ1Bm";

export async function getPracticeGuestUserId() {
  const user = await prisma.user.upsert({
    where: { email: PRACTICE_GUEST_EMAIL },
    update: {},
    create: {
      email: PRACTICE_GUEST_EMAIL,
      name: "Practice Guest",
      passwordHash: PRACTICE_GUEST_HASH,
      role: "scorer",
    },
    select: { id: true },
  });

  return user.id;
}
