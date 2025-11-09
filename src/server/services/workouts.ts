import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { prisma } from "@/server/db";
import { getOpenAIClient, trackEstimatedUsage } from "@/server/services/openai";
import { getDemoUser } from "@/server/utils/get-demo-user";

const workoutGenerationSchema = z.object({
  programName: z.string(),
  trainingFocus: z.enum(["Powerlifting", "Bodybuilding", "General Fitness"]).default("General Fitness"),
  programType: z.enum(["Microcycle", "Mesocycle", "Macrocycle", "Block"]),
  sessionLengthMinutes: z.number().int().positive(),
  experienceLevel: z.string(),
  startDate: z.string(),
  goals: z.string(),
  injuries: z.string().optional(),
  equipment: z.string(),
  trainingFrequency: z.number().int().positive(),
  powerliftingStats: z
    .object({
      squatMax: z.string().optional(),
      benchMax: z.string().optional(),
      deadliftMax: z.string().optional(),
    })
    .optional(),
});

export type WorkoutGenerationInput = z.infer<typeof workoutGenerationSchema>;

const workoutPlanSchema = z.object({
  programName: z.string(),
  type: z.string(),
  duration: z.string(),
  overview: z.string().optional(),
  days: z.array(
    z.object({
      day: z.string(),
      focus: z.string().optional(),
      exercises: z.array(
        z.object({
          name: z.string(),
          sets: z.number().int().nonnegative(),
          reps: z.union([z.string(), z.number()]),
          rest: z.number().int().nonnegative(),
          notes: z.string().optional(),
        }),
      ),
    }),
  ),
});

export type WorkoutPlan = z.infer<typeof workoutPlanSchema>;

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export async function createWorkoutArtifact(plan: WorkoutPlan, artifactId: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Program");

  sheet.columns = [
    { header: "Day", key: "day", width: 20 },
    { header: "Exercise", key: "exercise", width: 32 },
    { header: "Sets", key: "sets", width: 9 },
    { header: "Reps", key: "reps", width: 12 },
    { header: "Rest (sec)", key: "rest", width: 12 },
    { header: "Notes", key: "notes", width: 40 },
  ];

  sheet.getRow(1).font = { bold: true };

  for (const day of plan.days) {
    for (const exercise of day.exercises) {
      sheet.addRow({
        day: day.day,
        exercise: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.rest,
        notes: exercise.notes ?? "",
      });
    }
  }

  const artifactDir = path.join(process.cwd(), "storage", "artifacts");
  await fs.mkdir(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, `${artifactId}.xlsx`);
  await workbook.xlsx.writeFile(artifactPath);

  return artifactPath;
}

export async function generateWorkoutPlan(rawInput: WorkoutGenerationInput) {
  const input = workoutGenerationSchema.parse(rawInput);

  const openai = getOpenAIClient();

  trackEstimatedUsage(2); // Rough cents placeholder prior to actual billing details.

  const schema = {
    name: "workout_plan_schema",
    schema: {
      type: "object",
      properties: {
        programName: { type: "string" },
        type: { type: "string" },
        duration: { type: "string" },
        overview: { type: "string" },
        days: {
          type: "array",
          items: {
            type: "object",
            properties: {
              day: { type: "string" },
              focus: { type: "string" },
              exercises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    sets: { type: "integer" },
                    reps: { anyOf: [{ type: "string" }, { type: "integer" }] },
                    rest: { type: "integer" },
                    notes: { type: "string" },
                  },
                  required: ["name", "sets", "reps", "rest", "notes"],
                  additionalProperties: false,
                },
              },
            },
            required: ["day", "focus", "exercises"],
            additionalProperties: false,
          },
        },
      },
      required: ["programName", "type", "duration", "overview", "days"],
      additionalProperties: false,
    },
    strict: true,
  } as const;

  const prompt = `Generate a structured workout program in JSON format.
User context:
- Program Type: ${input.programType}
- Training Focus: ${input.trainingFocus}
- Session Length: ${input.sessionLengthMinutes} minutes
- Goals: ${input.goals}
- Equipment: ${input.equipment}
- Training Frequency: ${input.trainingFrequency} sessions/week
- Injuries: ${input.injuries ?? "None"}
- Experience: ${input.experienceLevel}
- Start Date: ${input.startDate}
- Powerlifting Stats: ${input.powerliftingStats ? JSON.stringify(input.powerliftingStats) : "N/A"}

Please emphasize actionable exercise selections and weekly progression cues when relevant.`;

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: [
      {
        role: "system",
        content: "You are an elite strength and wellness coach generating periodized training plans.",
      },
      { role: "user", content: prompt },
    ],
    text: {
      format: {
        type: "json_schema",
        name: schema.name,
        schema: schema.schema,
        strict: schema.strict,
      },
    },
  } as unknown as Parameters<typeof openai.responses.create>[0]);

  const jsonText = (response as { output_text?: string }).output_text;
  if (!jsonText) {
    throw new Error("OpenAI response did not contain JSON output");
  }

  const parsed = workoutPlanSchema.parse(JSON.parse(jsonText));

  const artifactId = `${Date.now()}-${slugify(parsed.programName || input.programName)}`;
  const artifactPath = await createWorkoutArtifact(parsed, artifactId);

  const user = await getDemoUser();

  const storedPlan = await prisma.aiWorkoutPlan.create({
    data: {
      userId: user.id,
      requestPayload: input,
      responsePayload: parsed,
      artifactPath,
    },
  });

  return { plan: parsed, artifactPath, record: storedPlan };
}

export async function listWorkoutPlans() {
  const user = await getDemoUser();

  return prisma.aiWorkoutPlan.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
}

export async function getWorkoutArtifactUrl(planId: string) {
  const user = await getDemoUser();
  const plan = await prisma.aiWorkoutPlan.findFirst({
    where: { id: planId, userId: user.id },
  });

  if (!plan) {
    return null;
  }

  const absolutePath = path.resolve(plan.artifactPath);
  return absolutePath;
}
