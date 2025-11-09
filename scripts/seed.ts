import "./_env";

import { addDays, subDays } from "date-fns";

import { prisma } from "../src/server/db";
import { createWorkoutArtifact, WorkoutPlan } from "../src/server/services/workouts";
import { getDemoUser } from "../src/server/utils/get-demo-user";

async function main() {
  const user = await getDemoUser();

  await prisma.analyzerFinding.deleteMany({ where: { userId: user.id } });
  await prisma.calendarItem.deleteMany({ where: { userId: user.id } });
  await prisma.workoutLog.deleteMany({ where: { userId: user.id } });
  await prisma.journalEntry.deleteMany({ where: { userId: user.id } });
  await prisma.aiWorkoutPlan.deleteMany({ where: { userId: user.id } });
  await prisma.featureSelections.deleteMany({ where: { userId: user.id } });

  const selection = await prisma.featureSelections.create({
    data: {
      userId: user.id,
      calendar: true,
      journal: true,
      aiWorkout: true,
      sleep: false,
    },
  });

  const now = new Date();

  await prisma.journalEntry.createMany({
    data: [
      {
        userId: user.id,
        content: "Felt focused through most meetings. Afternoon energy dip but recovered after a walk.",
        sentiment: 0.35,
        positivityTag: "Positive",
        createdAt: subDays(now, 2),
      },
      {
        userId: user.id,
        content: "Woke up groggy. Training session felt heavier than usual, but still finished all sets.",
        sentiment: -0.1,
        positivityTag: "Neutral",
        createdAt: subDays(now, 1),
      },
      {
        userId: user.id,
        content: "Great momentum today—cleared inbox, powered through workout, and had quality time with friends.",
        sentiment: 0.6,
        positivityTag: "Positive",
        createdAt: now,
      },
    ],
  });

  await prisma.workoutLog.createMany({
    data: [
      {
        userId: user.id,
        title: "Lower Body Strength",
        scheduledDate: subDays(now, 1),
        completed: true,
        notes: "Back squats moved well at RPE 7.",
      },
      {
        userId: user.id,
        title: "Active Recovery Flow",
        scheduledDate: now,
        completed: false,
        notes: "Plan: mobility + light conditioning",
      },
      {
        userId: user.id,
        title: "Upper Power Session",
        scheduledDate: addDays(now, 1),
        completed: false,
        notes: "Focus on explosive pressing and pull-ups",
      },
    ],
  });

  await prisma.calendarItem.createMany({
    data: [
      {
        userId: user.id,
        title: "Therapy check-in",
        dueDate: addDays(now, 2),
        completed: false,
      },
      {
        userId: user.id,
        title: "Project milestone review",
        dueDate: addDays(now, 1),
        completed: false,
      },
      {
        userId: user.id,
        title: "Meal prep for the week",
        dueDate: subDays(now, 1),
        completed: true,
      },
    ],
  });

  await prisma.analyzerFinding.createMany({
    data: [
      {
        userId: user.id,
        type: "REINFORCEMENT",
        title: "Momentum Building",
        message: "Consistent journaling and on-track workouts indicate strong resilience. Keep stacking these wins!",
        severity: 2,
        createdAt: subDays(now, 1),
      },
      {
        userId: user.id,
        type: "ALERT",
        title: "Energy Dip Detected",
        message: "Two journal entries mention fatigue and one workout is pending. Consider recovery strategies and scheduling a lighter day.",
        severity: 3,
        createdAt: now,
      },
    ],
  });

  const samplePlan: WorkoutPlan = {
    programName: "Adaptation Accelerator",
    type: "Hybrid Strength",
    duration: "4 weeks",
    overview:
      "Blend foundational strength work with mobility and conditioning to reinforce adaptability across stressful weeks.",
    days: [
      {
        day: "Day 1 - Lower Foundation",
        focus: "Strength + Stability",
        exercises: [
          { name: "Back Squat", sets: 4, reps: "5", rest: 150, notes: "RPE 7. Focus on bracing." },
          { name: "Romanian Deadlift", sets: 3, reps: "8", rest: 120, notes: "Tempo 3-1-1." },
          { name: "Split Squat", sets: 3, reps: "10/leg", rest: 90, notes: "Keep torso tall." },
          { name: "Hanging Knee Raise", sets: 3, reps: "12", rest: 60, notes: "Control swing." },
        ],
      },
      {
        day: "Day 2 - Neural Recharge",
        focus: "Mobility + Aerobic",
        exercises: [
          { name: "Couch Stretch", sets: 3, reps: "45 sec/side", rest: 30, notes: "Breathe deep." },
          { name: "Thoracic Spine Opener", sets: 3, reps: "12", rest: 30, notes: "Slow controlled reps." },
          { name: "Zone 2 Bike", sets: 1, reps: "20 min", rest: 0, notes: "Maintain nasal breathing." },
        ],
      },
      {
        day: "Day 3 - Upper Resilience",
        focus: "Strength + Power",
        exercises: [
          { name: "Bench Press", sets: 4, reps: "5", rest: 150, notes: "Cluster sets optional." },
          { name: "Weighted Pull-Up", sets: 4, reps: "6", rest: 120, notes: "Full range of motion." },
          { name: "Landmine Press", sets: 3, reps: "8/side", rest: 90, notes: "Drive through hips." },
          { name: "Tall Kneeling Pallof Press", sets: 3, reps: "12", rest: 60, notes: "Anti-rotation emphasis." },
        ],
      },
    ],
  };

  const artifactId = `${Date.now()}-adaptation-accelerator`;
  const artifactPath = await createWorkoutArtifact(samplePlan, artifactId);

  await prisma.aiWorkoutPlan.create({
    data: {
      userId: user.id,
      requestPayload: {
        programName: "Adaptation Accelerator",
        trainingFocus: "General Fitness",
        programType: "Mesocycle",
        sessionLengthMinutes: 60,
        experienceLevel: "Intermediate",
        startDate: now.toISOString().slice(0, 10),
        goals: "Maintain resilience during demanding work sprints",
        equipment: "Commercial gym setup",
        trainingFrequency: 4,
      },
      responsePayload: samplePlan,
      artifactPath,
    },
  });

  console.log("Seed complete:", {
    featureSelectionId: selection.id,
    journals: 3,
    workouts: 3,
    calendarItems: 3,
    findings: 2,
    workoutPlan: "Adaptation Accelerator",
    artifactPath,
  });
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  });
