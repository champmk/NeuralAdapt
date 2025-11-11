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

const sessionLiftSchema = z.object({
  name: z.string(),
  sets: z.number().int().min(1),
  reps: z.union([z.string(), z.number()]),
  intensity: z.string(),
  rest: z.union([z.string(), z.number().int().nonnegative()]),
  tempo: z.string().nullable(),
  notes: z.string().nullable(),
});

export const workoutPlanSchema = z.object({
  programName: z.string(),
  trainingFocus: z.string(),
  programType: z.string(),
  cycleLengthWeeks: z.number().int().positive(),
  startDate: z.string(),
  endDate: z.string(),
  athleteProfile: z.object({
    summary: z.string(),
    primaryGoals: z.array(z.string()).min(1),
    constraints: z.array(z.string()),
  }),
  methodology: z.object({
    periodizationModel: z.string(),
    volumeStrategy: z.string(),
    intensityStrategy: z.string(),
    frequencyStrategy: z.string(),
  }),
  phases: z
    .array(
    z.object({
      name: z.string(),
      startWeek: z.number().int().min(1),
      endWeek: z.number().int().min(1),
        objectives: z.array(z.string()).min(1),
        keyMetrics: z.array(z.string()).min(1),
      deloadWeek: z.number().int().nullable(),
    }),
    )
    .min(1),
  weeks: z
    .array(
    z.object({
      week: z.number().int().min(1),
      focus: z.string(),
        keyOutcomes: z.array(z.string()).min(1),
        sessions: z
          .array(
        z.object({
          day: z.string(),
          emphasis: z.string(),
          sessionMinutes: z.number().int().positive(),
          readinessCues: z.array(z.string()).default([]),
              mainLifts: z.array(sessionLiftSchema).min(1),
          accessoryWork: z
            .array(
              z.object({
                name: z.string(),
                sets: z.number().int().min(1),
                reps: z.union([z.number(), z.string()]),
                notes: z.string().nullable(),
              }),
            )
            .default([]),
          conditioning: z
            .array(
              z.object({
                modality: z.string(),
                durationMinutes: z.number().int().positive(),
                notes: z.string().nullable(),
              }),
            )
            .default([]),
          recovery: z.array(z.string()).default([]),
        }),
          )
          .min(1),
    }),
    )
    .min(1),
  monitoring: z.object({
    readinessChecks: z.array(z.string()).min(1),
    nutritionFocus: z.array(z.string()).min(1),
    recoveryProtocols: z.array(z.string()).min(1),
  }),
  coachingNotes: z.array(z.string()).min(1),
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

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Key", key: "key", width: 26 },
    { header: "Details", key: "value", width: 90 },
  ];

  const detailRows: Array<{ key: string; value: string }> = [
    { key: "Program", value: plan.programName },
    { key: "Focus", value: plan.trainingFocus },
    { key: "Type", value: plan.programType },
    { key: "Cycle Length", value: `${plan.cycleLengthWeeks} weeks` },
    { key: "Timeline", value: `${plan.startDate} to ${plan.endDate}` },
    { key: "Athlete Summary", value: plan.athleteProfile.summary },
    { key: "Primary Goals", value: plan.athleteProfile.primaryGoals.join(" | ") },
    {
      key: "Constraints",
      value: plan.athleteProfile.constraints.length > 0 ? plan.athleteProfile.constraints.join(" | ") : "None noted",
    },
    { key: "Periodization", value: plan.methodology.periodizationModel },
    { key: "Volume Strategy", value: plan.methodology.volumeStrategy },
    { key: "Intensity Strategy", value: plan.methodology.intensityStrategy },
    { key: "Frequency Strategy", value: plan.methodology.frequencyStrategy },
  ];

  detailRows.forEach((row, index) => {
    const excelRow = summary.addRow(row);
    if (index === 0) {
      excelRow.font = { bold: true };
    }
  });

  summary.addRow({ key: "", value: "" });
  summary.addRow({ key: "Phases", value: "" }).font = { bold: true };
  summary.addRow({ key: "Phase", value: "Focus" }).font = { bold: true };
  plan.phases.forEach((phase) => {
    summary.addRow({
      key: `${phase.name} (Weeks ${phase.startWeek}-${phase.endWeek}${phase.deloadWeek != null ? `, deload week ${phase.deloadWeek}` : ""})`,
      value: `${phase.objectives.join("; ")} | Metrics: ${phase.keyMetrics.join(", ")}`,
    });
  });

  summary.addRow({ key: "", value: "" });
  summary.addRow({ key: "Monitoring", value: "" }).font = { bold: true };
  summary.addRow({ key: "Readiness Checks", value: plan.monitoring.readinessChecks.join(" | ") });
  summary.addRow({ key: "Nutrition Focus", value: plan.monitoring.nutritionFocus.join(" | ") });
  summary.addRow({ key: "Recovery Protocols", value: plan.monitoring.recoveryProtocols.join(" | ") });

  summary.addRow({ key: "", value: "" });
  summary.addRow({ key: "Coaching Notes", value: "" }).font = { bold: true };
  plan.coachingNotes.forEach((note) => {
    summary.addRow({ key: "-", value: note });
  });

  const sessionsSheet = workbook.addWorksheet("Sessions");
  sessionsSheet.columns = [
    { header: "Week", key: "week", width: 8 },
    { header: "Day", key: "day", width: 14 },
    { header: "Emphasis", key: "emphasis", width: 24 },
    { header: "Session Minutes", key: "minutes", width: 14 },
    { header: "Lift/Block", key: "lift", width: 28 },
    { header: "Sets", key: "sets", width: 8 },
    { header: "Reps", key: "reps", width: 10 },
    { header: "Intensity", key: "intensity", width: 16 },
    { header: "Rest", key: "rest", width: 12 },
    { header: "Notes", key: "notes", width: 50 },
  ];

  sessionsSheet.getRow(1).font = { bold: true };

  for (const week of plan.weeks) {
    for (const session of week.sessions) {
      const common = {
        week: week.week,
        day: session.day,
        emphasis: session.emphasis,
        minutes: session.sessionMinutes,
      };

      session.mainLifts.forEach((lift) => {
        sessionsSheet.addRow({
          ...common,
          lift: lift.name,
          sets: lift.sets,
          reps: lift.reps,
          intensity: lift.intensity,
          rest: lift.rest,
          notes: [lift.tempo ? `Tempo: ${lift.tempo}` : null, lift.notes ?? null]
            .filter(Boolean)
            .join(" | "),
        });
      });

      if (session.accessoryWork.length > 0) {
        session.accessoryWork.forEach((accessory) => {
          sessionsSheet.addRow({
            ...common,
            lift: `Accessory - ${accessory.name}`,
            sets: accessory.sets,
            reps: accessory.reps,
            intensity: "N/A",
            rest: "N/A",
            notes: accessory.notes ?? "",
          });
        });
      }

      if (session.conditioning.length > 0) {
        session.conditioning.forEach((block) => {
          sessionsSheet.addRow({
            ...common,
            lift: `Conditioning - ${block.modality}`,
            sets: "N/A",
            reps: "N/A",
            intensity: "N/A",
            rest: "N/A",
            notes: `${block.durationMinutes} min${block.notes ? ` | ${block.notes}` : ""}`,
          });
        });
      }

      if (session.recovery.length > 0) {
        sessionsSheet.addRow({
          ...common,
          lift: "Recovery",
          sets: "N/A",
          reps: "N/A",
          intensity: "N/A",
          rest: "N/A",
          notes: session.recovery.join(" | "),
        });
      }

      if (session.readinessCues.length > 0) {
        sessionsSheet.addRow({
          ...common,
          lift: "Readiness",
          sets: "N/A",
          reps: "N/A",
          intensity: "N/A",
          rest: "N/A",
          notes: session.readinessCues.join(" | "),
        });
      }
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
    name: "elite_workout_plan_schema",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        programName: { type: "string" },
        trainingFocus: { type: "string" },
        programType: { type: "string" },
        cycleLengthWeeks: { type: "integer", minimum: 1 },
        startDate: { type: "string" },
        endDate: { type: "string" },
        athleteProfile: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            primaryGoals: { type: "array", items: { type: "string" }, minItems: 1 },
            constraints: { type: "array", items: { type: "string" } },
          },
          required: ["summary", "primaryGoals", "constraints"],
        },
        methodology: {
          type: "object",
          additionalProperties: false,
          properties: {
            periodizationModel: { type: "string" },
            volumeStrategy: { type: "string" },
            intensityStrategy: { type: "string" },
            frequencyStrategy: { type: "string" },
          },
          required: ["periodizationModel", "volumeStrategy", "intensityStrategy", "frequencyStrategy"],
        },
        phases: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              startWeek: { type: "integer", minimum: 1 },
              endWeek: { type: "integer", minimum: 1 },
              objectives: { type: "array", items: { type: "string" }, minItems: 1 },
              keyMetrics: { type: "array", items: { type: "string" }, minItems: 1 },
              deloadWeek: { type: ["integer", "null"] },
            },
            required: ["name", "startWeek", "endWeek", "objectives", "keyMetrics", "deloadWeek"],
          },
        },
        weeks: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              week: { type: "integer", minimum: 1 },
              focus: { type: "string" },
              keyOutcomes: { type: "array", items: { type: "string" }, minItems: 1 },
              sessions: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    day: { type: "string" },
                    emphasis: { type: "string" },
                    sessionMinutes: { type: "integer", minimum: 1 },
                    readinessCues: { type: "array", items: { type: "string" } },
                    mainLifts: {
                      type: "array",
                      minItems: 1,
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          name: { type: "string" },
                          sets: { type: "integer" },
                          reps: { anyOf: [{ type: "string" }, { type: "integer" }] },
                          intensity: { type: "string" },
                          rest: { anyOf: [{ type: "string" }, { type: "integer" }] },
                          tempo: { type: ["string", "null"] },
                          notes: { type: ["string", "null"] },
                        },
                        required: ["name", "sets", "reps", "intensity", "rest", "tempo", "notes"],
                      },
                    },
                    accessoryWork: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          name: { type: "string" },
                          sets: { type: "integer" },
                          reps: { anyOf: [{ type: "string" }, { type: "integer" }] },
                          notes: { type: ["string", "null"] },
                        },
                        required: ["name", "sets", "reps", "notes"],
                      },
                    },
                    conditioning: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          modality: { type: "string" },
                          durationMinutes: { type: "integer" },
                          notes: { type: ["string", "null"] },
                        },
                        required: ["modality", "durationMinutes", "notes"],
                      },
                    },
                    recovery: { type: "array", items: { type: "string" } },
                  },
                  required: ["day", "emphasis", "sessionMinutes", "readinessCues", "mainLifts", "accessoryWork", "conditioning", "recovery"],
                },
              },
            },
            required: ["week", "focus", "keyOutcomes", "sessions"],
          },
        },
        monitoring: {
          type: "object",
          additionalProperties: false,
          properties: {
            readinessChecks: { type: "array", items: { type: "string" }, minItems: 1 },
            nutritionFocus: { type: "array", items: { type: "string" }, minItems: 1 },
            recoveryProtocols: { type: "array", items: { type: "string" }, minItems: 1 },
          },
          required: ["readinessChecks", "nutritionFocus", "recoveryProtocols"],
        },
        coachingNotes: { type: "array", items: { type: "string" }, minItems: 1 },
      },
      required: [
        "programName",
        "trainingFocus",
        "programType",
        "cycleLengthWeeks",
        "startDate",
        "endDate",
        "athleteProfile",
        "methodology",
        "phases",
        "weeks",
        "monitoring",
        "coachingNotes",
      ],
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

Design an elite-level multi-week training plan that aligns with evidence-based methodologies for ${input.trainingFocus} athletes. Follow these guardrails:
- Periodize volume and intensity across phases (accumulation, intensification, realization/deload as appropriate).
- Match weekly session counts to the provided training frequency and keep sessionMinutes close to ${input.sessionLengthMinutes} without exceeding it significantly.
- Provide main lift prescriptions with sets x reps, precise intensity targets (RPE or %1RM), and note tempo when useful.
- Integrate accessory work, conditioning, and recovery aligned with the athlete\'s goals, equipment, injuries, and experience level.
- Include readiness monitoring, nutrition priorities, and coaching notes rooted in elite coaching frameworks (e.g., managing MRV, using RPE, monitoring HRV/sleep).
- Reference the elite methodology briefs (advanced periodization playbooks, assessment ladders, neuro-readiness protocols) to justify structure and progression choices.
- Ensure phases and weeks align (weeks must cover the entire cycleLengthWeeks window and respect deload timing). Compute an end date consistent with cycle length when possible.
- When a field expects an array but you have no data, respond with an empty array instead of omitting the field.
- Always include the deloadWeek field for each phase; use null when that phase does not include a deload.
- Every main lift entry must include a tempo field; use null if no tempo cue is required.
- Every main lift entry must include a notes field; use null when no coaching note is necessary.
- Accessory and conditioning entries must include a notes field; use null when no note applies.
- For every session, include readinessCues, accessoryWork, conditioning, and recovery arrays; use [] when nothing applies.
- Keep terminology professional and concise so it can be rendered directly in the UI.`;

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
