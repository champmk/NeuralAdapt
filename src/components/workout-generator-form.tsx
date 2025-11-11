"use client";

import { useMemo } from "react";
import { useFormStatus } from "react-dom";

import { submitWorkoutGeneration } from "@/app/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Generating..." : "Generate Plan"}
    </button>
  );
}

type WorkoutGeneratorFormProps = {
  visible: boolean;
};

export function WorkoutGeneratorForm({ visible }: WorkoutGeneratorFormProps) {
  const focusOptions = useMemo(
    () => ["Powerlifting", "Bodybuilding", "General Fitness"] as const,
    [],
  );

  if (!visible) {
    return null;
  }

  return (
    <form action={submitWorkoutGeneration} className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-900/60 via-indigo-900/20 to-transparent p-6 text-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">AI Workout Programmer Intake</h2>
        <p className="text-sm text-white/70">
          OpenAI now crafts a periodized block you can review on the dashboard and export to Excel. Keep inputs concise to control token usage.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span>Program Name</span>
          <input
            required
            name="programName"
            placeholder="e.g., Resilient Strength Build"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Program Type</span>
          <select
            name="programType"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          >
            <option>Microcycle</option>
            <option>Mesocycle</option>
            <option>Macrocycle</option>
            <option>Block</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Training Focus</span>
          <select
            name="trainingFocus"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          >
            {focusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Session Length (minutes)</span>
          <input
            required
            name="sessionLengthMinutes"
            type="number"
            min={15}
            max={180}
            defaultValue={60}
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Experience Level</span>
          <input
            required
            name="experienceLevel"
            placeholder="e.g., Intermediate lifter"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Start Date</span>
          <input
            required
            name="startDate"
            type="date"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm md:col-span-2">
          <span>Primary Goals</span>
          <textarea
            required
            name="goals"
            rows={2}
            placeholder="Outline specific outcomes, competition prep, or health milestones"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Existing Injuries / Considerations</span>
          <textarea
            name="injuries"
            rows={2}
            placeholder="Optional - note movement restrictions or rehab constraints"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Available Equipment</span>
          <textarea
            required
            name="equipment"
            rows={2}
            placeholder="List key equipment or limitations"
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span>Weekly Training Frequency</span>
          <input
            required
            name="trainingFrequency"
            type="number"
            min={1}
            max={7}
            defaultValue={4}
            className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
          />
        </label>
      </div>

      <fieldset className="mt-4 rounded-xl border border-white/10 p-4 text-sm">
        <legend className="px-2 text-xs uppercase tracking-wider text-white/60">Powerlifting Stats (optional)</legend>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span>Squat 1RM</span>
            <input
              name="squatMax"
              placeholder="e.g., 365 lbs"
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Bench 1RM</span>
            <input
              name="benchMax"
              placeholder="e.g., 245 lbs"
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Deadlift 1RM</span>
            <input
              name="deadliftMax"
              placeholder="e.g., 405 lbs"
              className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
            />
          </label>
        </div>
      </fieldset>

      <div className="mt-6 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
