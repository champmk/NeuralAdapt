import { prisma } from "@/server/db";
import { getDemoUser } from "@/server/utils/get-demo-user";

export async function getDashboardState() {
  const user = await getDemoUser();

  const [latestSelection] = await prisma.featureSelections.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  const [latestWorkoutPlan] = await prisma.aiWorkoutPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 1,
  });

  const journalEntries = await prisma.journalEntry.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const workoutLogs = await prisma.workoutLog.findMany({
    where: { userId: user.id },
    orderBy: { scheduledDate: "desc" },
    take: 5,
  });

  const calendarItems = await prisma.calendarItem.findMany({
    where: { userId: user.id },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  const analyzerFindings = await prisma.analyzerFinding.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    user,
    latestSelection,
    latestWorkoutPlan,
    journalEntries,
    workoutLogs,
    calendarItems,
    analyzerFindings,
  };
}
