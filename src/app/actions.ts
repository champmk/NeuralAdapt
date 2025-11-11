"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/server/db";
import { generateWorkoutPlan } from "@/server/services/workouts";
import { getDemoUser } from "@/server/utils/get-demo-user";

const featureSelectionSchema = z.object({
  calendar: z.boolean().optional().default(false),
  journal: z.boolean().optional().default(false),
  aiWorkout: z.boolean().optional().default(false),
  sleep: z.boolean().optional().default(false),
});

export async function updateFeatureSelection(formData: FormData) {
  const parsed = featureSelectionSchema.parse({
    calendar: formData.get("calendar") === "on",
    journal: formData.get("journal") === "on",
    aiWorkout: formData.get("aiWorkout") === "on",
    sleep: formData.get("sleep") === "on",
  });

  const user = await getDemoUser();

  await prisma.featureSelections.create({
    data: {
      userId: user.id,
      calendar: parsed.calendar,
      journal: parsed.journal,
      aiWorkout: parsed.aiWorkout,
      sleep: parsed.sleep,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/start");
}

const workoutFormSchema = z.object({
  programName: z.string().min(3),
  trainingFocus: z.enum(["Powerlifting", "Bodybuilding", "General Fitness"]),
  programType: z.enum(["Microcycle", "Mesocycle", "Macrocycle", "Block"]),
  sessionLengthMinutes: z.coerce.number().int().positive(),
  experienceLevel: z.string().min(2),
  startDate: z.string().min(1),
  goals: z.string().min(3),
  injuries: z.string().optional(),
  equipment: z.string().min(2),
  trainingFrequency: z.coerce.number().int().positive(),
  squatMax: z.string().optional(),
  benchMax: z.string().optional(),
  deadliftMax: z.string().optional(),
});

export async function submitWorkoutGeneration(formData: FormData) {
  const parsed = workoutFormSchema.parse({
    programName: formData.get("programName")?.toString(),
    trainingFocus: formData.get("trainingFocus")?.toString(),
    programType: formData.get("programType")?.toString(),
    sessionLengthMinutes: formData.get("sessionLengthMinutes")?.toString(),
    experienceLevel: formData.get("experienceLevel")?.toString(),
    startDate: formData.get("startDate")?.toString(),
    goals: formData.get("goals")?.toString(),
    injuries: formData.get("injuries")?.toString(),
    equipment: formData.get("equipment")?.toString(),
    trainingFrequency: formData.get("trainingFrequency")?.toString(),
    squatMax: formData.get("squatMax")?.toString(),
    benchMax: formData.get("benchMax")?.toString(),
    deadliftMax: formData.get("deadliftMax")?.toString(),
  });

  await generateWorkoutPlan({
    programName: parsed.programName,
    trainingFocus: parsed.trainingFocus,
    programType: parsed.programType,
    sessionLengthMinutes: parsed.sessionLengthMinutes,
    experienceLevel: parsed.experienceLevel,
    startDate: parsed.startDate,
    goals: parsed.goals,
    injuries: parsed.injuries,
    equipment: parsed.equipment,
    trainingFrequency: parsed.trainingFrequency,
    powerliftingStats:
      parsed.trainingFocus === "Powerlifting"
        ? {
            squatMax: parsed.squatMax,
            benchMax: parsed.benchMax,
            deadliftMax: parsed.deadliftMax,
          }
        : undefined,
  });

  revalidatePath("/dashboard");
  revalidatePath("/start");
}

const journalSchema = z.object({
  content: z.string().min(3),
});

export async function createJournalEntry(formData: FormData) {
  const { content } = journalSchema.parse({ content: formData.get("content")?.toString() });
  const user = await getDemoUser();

  await prisma.journalEntry.create({
    data: {
      userId: user.id,
      content,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/journal/new");
}

const workoutLogSchema = z.object({
  title: z.string().min(3),
  scheduledDate: z.string(),
  notes: z.string().optional(),
});

export async function createWorkoutLog(formData: FormData) {
  const parsed = workoutLogSchema.parse({
    title: formData.get("title")?.toString(),
    scheduledDate: formData.get("scheduledDate")?.toString(),
    notes: formData.get("notes")?.toString(),
  });

  const user = await getDemoUser();

  await prisma.workoutLog.create({
    data: {
      userId: user.id,
      title: parsed.title,
      scheduledDate: new Date(parsed.scheduledDate),
      notes: parsed.notes,
    },
  });

  revalidatePath("/dashboard");
}

const toggleWorkoutSchema = z.object({
  workoutId: z.string().min(1),
  completed: z.string().transform((value) => value === "true"),
});

export async function toggleWorkoutCompletion(formData: FormData) {
  const parsed = toggleWorkoutSchema.parse({
    workoutId: formData.get("workoutId")?.toString(),
    completed: formData.get("completed")?.toString(),
  });

  const user = await getDemoUser();

  await prisma.workoutLog.updateMany({
    where: { id: parsed.workoutId, userId: user.id },
    data: { completed: parsed.completed },
  });

  revalidatePath("/dashboard");
}

const calendarSchema = z.object({
  title: z.string().min(3),
  dueDate: z.string(),
});

export async function createCalendarItem(formData: FormData) {
  const parsed = calendarSchema.parse({
    title: formData.get("title")?.toString(),
    dueDate: formData.get("dueDate")?.toString(),
  });

  const user = await getDemoUser();

  await prisma.calendarItem.create({
    data: {
      userId: user.id,
      title: parsed.title,
      dueDate: new Date(parsed.dueDate),
    },
  });

  revalidatePath("/dashboard");
}

const toggleCalendarSchema = z.object({
  itemId: z.string().min(1),
  completed: z.string().transform((value) => value === "true"),
});

export async function toggleCalendarItemCompletion(formData: FormData) {
  const parsed = toggleCalendarSchema.parse({
    itemId: formData.get("itemId")?.toString(),
    completed: formData.get("completed")?.toString(),
  });

  const user = await getDemoUser();

  await prisma.calendarItem.updateMany({
    where: { id: parsed.itemId, userId: user.id },
    data: { completed: parsed.completed },
  });

  revalidatePath("/dashboard");
}
