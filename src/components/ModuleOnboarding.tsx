"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Stepper, { Step } from "@/components/Stepper";
import { updateFeatureSelection, submitWorkoutGeneration } from "@/app/actions";

type ModuleSelection = {
  calendar: boolean;
  journal: boolean;
  aiWorkout: boolean;
  sleep: boolean;
};

type ModuleOnboardingProps = {
  initialSelection: ModuleSelection | null;
  initialStep?: number;
  forceWorkoutStep?: boolean;
};

const defaultSelection: ModuleSelection = {
  calendar: true,
  journal: true,
  aiWorkout: false,
  sleep: false,
};

const focusOptions = ["Powerlifting", "Bodybuilding", "General Fitness"] as const;
const programTypes = ["Microcycle", "Mesocycle", "Macrocycle", "Block"] as const;

const initialWorkoutForm = {
  programName: "",
  programType: programTypes[0],
  trainingFocus: focusOptions[0],
  sessionLengthMinutes: "60",
  experienceLevel: "",
  startDate: "",
  goals: "",
  injuries: "",
  equipment: "",
  trainingFrequency: "4",
  squatMax: "",
  benchMax: "",
  deadliftMax: "",
};

export default function ModuleOnboarding({ initialSelection, initialStep, forceWorkoutStep = false }: ModuleOnboardingProps) {
  const router = useRouter();
  const baseSelection = useMemo(() => {
    if (initialSelection) {
      return forceWorkoutStep ? { ...initialSelection, aiWorkout: true } : initialSelection;
    }
    if (forceWorkoutStep) {
      return { ...defaultSelection, aiWorkout: true };
    }
    return initialSelection ?? defaultSelection;
  }, [initialSelection, forceWorkoutStep]);

  const resolvedInitialStep = initialStep ?? (forceWorkoutStep ? 2 : 1);

  const [selection, setSelection] = useState<ModuleSelection>(baseSelection);
  const [includeWorkoutStep, setIncludeWorkoutStep] = useState<boolean>(forceWorkoutStep || baseSelection.aiWorkout);
  const [currentStep, setCurrentStep] = useState<number>(resolvedInitialStep);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savingSelection, setSavingSelection] = useState(false);
  const [submittingWorkout, setSubmittingWorkout] = useState(false);
  const [workoutForm, setWorkoutForm] = useState(initialWorkoutForm);

  const modules = useMemo(
    () => [
      {
        key: "calendar" as const,
        title: "Calendar + Task Tracker",
        description: "Monitor commitments and feed adherence insights to the analyzer.",
      },
      {
        key: "journal" as const,
        title: "Guided Daily Journal",
        description: "Capture reflections that power sentiment curves and interventions.",
      },
      {
        key: "aiWorkout" as const,
        title: "AI Workout Programmer",
        description: "Generate OpenAI-powered training blocks with Excel exports.",
      },
      {
        key: "sleep" as const,
        title: "Sleep Tracking (Preview)",
        description: "Future pipeline for rest quality insights and circadian nudges.",
      },
    ],
    [],
  );

  const handleModuleToggle = (key: keyof ModuleSelection) => {
    setSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleWorkoutInputChange = (field: keyof typeof workoutForm, value: string) => {
    setWorkoutForm((prev) => ({ ...prev, [field]: value }));
  };

  const ensureAtLeastOneSelected = () => Object.values(selection).some(Boolean);

  const persistFeatureSelection = async () => {
    setSavingSelection(true);
    try {
      const formData = new FormData();
      if (selection.calendar) formData.append("calendar", "on");
      if (selection.journal) formData.append("journal", "on");
      if (selection.aiWorkout) formData.append("aiWorkout", "on");
      if (selection.sleep) formData.append("sleep", "on");
      await updateFeatureSelection(formData);
    } finally {
      setSavingSelection(false);
    }
  };

  const submitWorkoutPlan = async () => {
    setSubmittingWorkout(true);
    try {
      const formData = new FormData();
      formData.append("programName", workoutForm.programName);
      formData.append("programType", workoutForm.programType);
      formData.append("trainingFocus", workoutForm.trainingFocus);
      formData.append("sessionLengthMinutes", workoutForm.sessionLengthMinutes);
      formData.append("experienceLevel", workoutForm.experienceLevel);
      formData.append("startDate", workoutForm.startDate);
      formData.append("goals", workoutForm.goals);
      if (workoutForm.injuries.trim()) formData.append("injuries", workoutForm.injuries);
      formData.append("equipment", workoutForm.equipment);
      formData.append("trainingFrequency", workoutForm.trainingFrequency);
      if (workoutForm.squatMax.trim()) formData.append("squatMax", workoutForm.squatMax);
      if (workoutForm.benchMax.trim()) formData.append("benchMax", workoutForm.benchMax);
      if (workoutForm.deadliftMax.trim()) formData.append("deadliftMax", workoutForm.deadliftMax);
      await submitWorkoutGeneration(formData);
    } finally {
      setSubmittingWorkout(false);
    }
  };

  const handleStepNext = async (step: number) => {
    if (step === 1) {
      if (savingSelection) return false;
      if (!ensureAtLeastOneSelected()) {
        setErrorMessage("Select at least one module to continue.");
        return false;
      }
      setErrorMessage(null);
      try {
        await persistFeatureSelection();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to save selection. Try again.");
        return false;
      }
      if (!selection.aiWorkout) {
        router.push("/dashboard");
        router.refresh();
        return false;
      }
      setIncludeWorkoutStep(true);
      return true;
    }

    if (step === 2) {
      if (submittingWorkout) return false;
      if (!workoutForm.programName.trim() || !workoutForm.experienceLevel.trim() || !workoutForm.goals.trim() || !workoutForm.equipment.trim() || !workoutForm.startDate.trim()) {
        setErrorMessage("Please complete all required fields before generating your plan.");
        return false;
      }
      setErrorMessage(null);
      try {
        await submitWorkoutPlan();
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to generate the workout plan. Try again.");
        return false;
      }
      return false;
    }

    return true;
  };

  return (
    <div className="flex w-full justify-center">
      <Stepper
        initialStep={resolvedInitialStep}
        onStepChange={(step) => {
          setCurrentStep(step);
          setErrorMessage(null);
        }}
        onStepNext={handleStepNext}
        nextButtonText="Continue"
        backButtonText="Previous"
        nextButtonProps={{
          disabled: (currentStep === 1 && savingSelection) || (currentStep === 2 && submittingWorkout),
        }}
        footerClassName="mt-6"
      >
        <Step>
          <div className="flex flex-col gap-6 text-left text-white">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Module Selection</p>
              <h2 className="text-2xl font-semibold">Choose your Neural Adapt modules</h2>
              <p className="text-sm text-white/70">
                Toggle the experiences you want to explore first. You can always adjust these inside the dashboard later on.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {modules.map((module) => {
                const selected = selection[module.key];
                return (
                  <label
                    key={module.key}
                    className={`group flex cursor-pointer items-start gap-3 rounded-2xl border p-5 transition ${
                      selected
                        ? "border-emerald-400/70 bg-white/10 backdrop-blur"
                        : "border-white/10 bg-black/30 hover:border-white/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-emerald-500"
                      checked={selected}
                      onChange={() => handleModuleToggle(module.key)}
                    />
                    <span>
                      <span className="block text-base font-semibold text-white">{module.title}</span>
                      <span className="mt-1 block text-sm text-white/70">{module.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            {errorMessage && currentStep === 1 ? <p className="text-center text-sm text-rose-300">{errorMessage}</p> : null}
          </div>
        </Step>

        {includeWorkoutStep ? (
          <Step>
            <div className="flex flex-col gap-6 text-left text-white">
              <div className="space-y-2 text-center">
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-300">AI Workout Programmer</p>
                <h2 className="text-2xl font-semibold">Dial in your training blueprint</h2>
                <p className="text-sm text-white/70">
                  OpenAI will craft a multi-day plan and export it as an Excel file for you. Keep inputs concise to control token usage.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span>Program Name</span>
                  <input
                    required
                    value={workoutForm.programName}
                    onChange={(event) => handleWorkoutInputChange("programName", event.target.value)}
                    placeholder="e.g., Resilient Strength Build"
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Program Type</span>
                  <select
                    value={workoutForm.programType}
                    onChange={(event) => handleWorkoutInputChange("programType", event.target.value)}
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  >
                    {programTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Training Focus</span>
                  <select
                    value={workoutForm.trainingFocus}
                    onChange={(event) => handleWorkoutInputChange("trainingFocus", event.target.value)}
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
                    type="number"
                    min={15}
                    max={180}
                    value={workoutForm.sessionLengthMinutes}
                    onChange={(event) => handleWorkoutInputChange("sessionLengthMinutes", event.target.value)}
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Experience Level</span>
                  <input
                    required
                    value={workoutForm.experienceLevel}
                    onChange={(event) => handleWorkoutInputChange("experienceLevel", event.target.value)}
                    placeholder="e.g., Intermediate lifter"
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Start Date</span>
                  <input
                    required
                    type="date"
                    value={workoutForm.startDate}
                    onChange={(event) => handleWorkoutInputChange("startDate", event.target.value)}
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm md:col-span-2">
                  <span>Primary Goals</span>
                  <textarea
                    required
                    rows={2}
                    value={workoutForm.goals}
                    onChange={(event) => handleWorkoutInputChange("goals", event.target.value)}
                    placeholder="Outline specific outcomes, competition prep, or health milestones"
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Existing Injuries / Considerations</span>
                  <textarea
                    rows={2}
                    value={workoutForm.injuries}
                    onChange={(event) => handleWorkoutInputChange("injuries", event.target.value)}
                    placeholder="Optional - note movement restrictions or rehab constraints"
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Available Equipment</span>
                  <textarea
                    required
                    rows={2}
                    value={workoutForm.equipment}
                    onChange={(event) => handleWorkoutInputChange("equipment", event.target.value)}
                    placeholder="List key equipment or limitations"
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span>Weekly Training Frequency</span>
                  <input
                    required
                    type="number"
                    min={1}
                    max={7}
                    value={workoutForm.trainingFrequency}
                    onChange={(event) => handleWorkoutInputChange("trainingFrequency", event.target.value)}
                    className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                  />
                </label>
              </div>

              <fieldset className="rounded-xl border border-white/10 p-4 text-sm">
                <legend className="px-2 text-xs uppercase tracking-wider text-white/60">Powerlifting Stats (optional)</legend>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-1">
                    <span>Squat 1RM</span>
                    <input
                      value={workoutForm.squatMax}
                      onChange={(event) => handleWorkoutInputChange("squatMax", event.target.value)}
                      placeholder="e.g., 365 lbs"
                      className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Bench 1RM</span>
                    <input
                      value={workoutForm.benchMax}
                      onChange={(event) => handleWorkoutInputChange("benchMax", event.target.value)}
                      placeholder="e.g., 245 lbs"
                      className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Deadlift 1RM</span>
                    <input
                      value={workoutForm.deadliftMax}
                      onChange={(event) => handleWorkoutInputChange("deadliftMax", event.target.value)}
                      placeholder="e.g., 405 lbs"
                      className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white outline-none focus:border-indigo-400"
                    />
                  </label>
                </div>
              </fieldset>

              {errorMessage && currentStep === 2 ? <p className="text-center text-sm text-rose-300">{errorMessage}</p> : null}
            </div>
          </Step>
        ) : null}
      </Stepper>
    </div>
  );
}
