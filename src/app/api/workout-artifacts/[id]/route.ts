import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { prisma } from "@/server/db";
import { getDemoUser } from "@/server/utils/get-demo-user";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getDemoUser();

  const plan = await prisma.aiWorkoutPlan.findFirst({
    where: { id, userId: user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const resolvedPath = path.resolve(plan.artifactPath);
  try {
    const fileBuffer = await fs.readFile(resolvedPath);
    const fileName = path.basename(resolvedPath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${fileName}`,
      },
    });
  } catch (error) {
    console.error("Failed to read artifact", error);
    return NextResponse.json({ error: "Failed to load artifact" }, { status: 500 });
  }
}
