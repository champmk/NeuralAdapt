"use client";

import { format } from "date-fns";
import { useTransition } from "react";

import { createWorkoutLog, toggleWorkoutCompletion } from "@/app/actions";

export type WorkoutLog = {
  id: string;
  title: string;
  scheduledDate: string;
  completed: boolean;
  notes: string | null;
};

type WorkoutLogPanelProps = {
  workouts: WorkoutLog[];
};

export function WorkoutLogPanel({ workouts }: WorkoutLogPanelProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (workoutId: string, completed: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("workoutId", workoutId);
      formData.append("completed", String(!completed));
      await toggleWorkoutCompletion(formData);
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Workout Log</h2>
        <p className="text-sm text-white/70">
          Track adherence to generated plans and manual workouts. Completion streaks inform the analyzer.
        </p>
      </div>

      <form action={createWorkoutLog} className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          required
          name="title"
          placeholder="Workout name"
          className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          required
          type="datetime-local"
          name="scheduledDate"
          className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          name="notes"
          placeholder="Notes (optional)"
          className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Log Workout
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {workouts.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white/60">
            Scheduled training sessions will appear here.
          </div>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/40 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-white">{workout.title}</p>
                <p className="text-xs text-white/60">
                  {format(new Date(workout.scheduledDate), "MMM d, yyyy h:mm a")} • {workout.completed ? "Completed" : "Scheduled"}
                </p>
                {workout.notes ? (
                  <p className="mt-1 text-sm text-white/70">{workout.notes}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleToggle(workout.id, workout.completed)}
                className="self-start rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-emerald-400 hover:text-emerald-200"
                disabled={isPending}
              >
                {workout.completed ? "Mark as Pending" : "Mark Complete"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
