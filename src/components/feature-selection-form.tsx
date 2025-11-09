"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { updateFeatureSelection } from "@/app/actions";

type FeatureSelectionFormProps = {
  initial: {
    calendar: boolean;
    journal: boolean;
    aiWorkout: boolean;
    sleep: boolean;
  } | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save Feature Selection"}
    </button>
  );
}

export function FeatureSelectionForm({ initial }: FeatureSelectionFormProps) {
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <form action={updateFeatureSelection} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Choose Your Neural Adapt Modules</h2>
          <p className="mt-1 text-sm text-white/70">
            Toggle the experiences you want to explore in this demo. You can adjust these at any time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setHelpVisible((prev) => !prev)}
          className="text-sm text-emerald-300 hover:text-emerald-200"
        >
          {helpVisible ? "Hide details" : "What does each module do?"}
        </button>
      </div>

      {helpVisible ? (
        <ul className="mt-4 space-y-2 text-sm text-white/80">
          <li>
            <span className="font-medium text-white">Calendar & Tasks:</span> Track commitments and completion streaks that feed the analyzer.
          </li>
          <li>
            <span className="font-medium text-white">Daily Journal:</span> Capture reflections; sentiment scores guide interventions.
          </li>
          <li>
            <span className="font-medium text-white">AI Workout Programmer:</span> Generate tailor-made training plans enhanced by OpenAI.
          </li>
          <li>
            <span className="font-medium text-white">Sleep Tracking (Preview):</span> Placeholder for future sleep hygiene analysis.
          </li>
        </ul>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
          <input
            type="checkbox"
            name="calendar"
            defaultChecked={initial?.calendar ?? true}
            className="mt-1 h-4 w-4 accent-emerald-500"
          />
          <span>
            <span className="block text-sm font-semibold text-white">Calendar + Task Tracker</span>
            <span className="text-sm text-white/70">Monitor commitments and feed adherence insights to the analyzer.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
          <input
            type="checkbox"
            name="journal"
            defaultChecked={initial?.journal ?? true}
            className="mt-1 h-4 w-4 accent-emerald-500"
          />
          <span>
            <span className="block text-sm font-semibold text-white">Guided Daily Journal</span>
            <span className="text-sm text-white/70">Capture reflections that power sentiment curves and interventions.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
          <input
            type="checkbox"
            name="aiWorkout"
            defaultChecked={initial?.aiWorkout ?? false}
            className="mt-1 h-4 w-4 accent-emerald-500"
          />
          <span>
            <span className="block text-sm font-semibold text-white">AI Workout Programmer</span>
            <span className="text-sm text-white/70">Generate OpenAI-powered training blocks with Excel exports.</span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
          <input
            type="checkbox"
            name="sleep"
            defaultChecked={initial?.sleep ?? false}
            className="mt-1 h-4 w-4 accent-emerald-500"
          />
          <span>
            <span className="block text-sm font-semibold text-white">Sleep Tracking (Preview)</span>
            <span className="text-sm text-white/70">Future pipeline for rest quality insights and circadian nudges.</span>
          </span>
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
