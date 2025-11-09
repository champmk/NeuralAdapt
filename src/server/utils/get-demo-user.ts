import { prisma } from "@/server/db";

const DEMO_EMAIL = "demo@neuraladapt.local";

export async function getDemoUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
  });

  if (existing) {
    return existing;
  }

  return prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      featureSelections: {
        create: {},
      },
    },
  });
}
