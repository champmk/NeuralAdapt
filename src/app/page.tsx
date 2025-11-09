export const dynamic = "force-dynamic";

import { AnalyzerFeed } from "@/components/analyzer-feed";
import { CalendarPanel } from "@/components/calendar-panel";
import { FeatureSelectionForm } from "@/components/feature-selection-form";
import { JournalPanel } from "@/components/journal-panel";
import { SuccessWebSummary } from "@/components/success-web-summary";
import { WorkoutGeneratorForm } from "@/components/workout-generator-form";
import { WorkoutLogPanel } from "@/components/workout-log-panel";
import { getDashboardState } from "@/server/services/dashboard";

type DashboardState = Awaited<ReturnType<typeof getDashboardState>>;

export default async function HomePage() {
  const state: DashboardState = await getDashboardState();

  const latestSelection = state.latestSelection
    ? {
        calendar: state.latestSelection.calendar,
        journal: state.latestSelection.journal,
        aiWorkout: state.latestSelection.aiWorkout,
        sleep: state.latestSelection.sleep,
        createdAt: state.latestSelection.createdAt.toISOString(),
      }
    : null;

  const latestWorkout = state.latestWorkoutPlan
    ? {
        id: state.latestWorkoutPlan.id,
        programName:
          typeof state.latestWorkoutPlan.responsePayload === "object" && state.latestWorkoutPlan.responsePayload !== null
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (state.latestWorkoutPlan.responsePayload as any).programName ?? "AI Workout"
            : "AI Workout",
        createdAt: state.latestWorkoutPlan.createdAt.toISOString(),
        artifactPath: state.latestWorkoutPlan.artifactPath,
      }
    : null;

  const showWorkoutGenerator = latestSelection?.aiWorkout ?? false;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      <section className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-12">
        <header className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.25),_transparent_60%)] p-10 text-center shadow-2xl">
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Agentic wellness companion</p>
            <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
              Neural Adapt keeps a pulse on your mental and physical health—intervening before you hit the wall.
            </h1>
            <p className="text-base text-white/70">
              Configure the modules you want, generate AI-personalized workouts powered by OpenAI, and let the analyzer agent surface timely
              warnings or reinforcement inside the Success Web dashboard.
            </p>
          </div>
        </header>

        <SuccessWebSummary selection={latestSelection} latestWorkout={latestWorkout} />

        <FeatureSelectionForm initial={latestSelection} />

        <WorkoutGeneratorForm visible={showWorkoutGenerator} />

        <div className="grid gap-6 lg:grid-cols-2">
          <JournalPanel
            entries={state.journalEntries.map((entry: DashboardState["journalEntries"][number]) => ({
              id: entry.id,
              content: entry.content,
              createdAt: entry.createdAt.toISOString(),
              positivityTag: entry.positivityTag,
              sentiment: entry.sentiment,
            }))}
          />
          <AnalyzerFeed
            findings={state.analyzerFindings.map((finding: DashboardState["analyzerFindings"][number]) => ({
              id: finding.id,
              title: finding.title,
              message: finding.message,
              type: finding.type,
              severity: finding.severity,
              createdAt: finding.createdAt.toISOString(),
            }))}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <WorkoutLogPanel
            workouts={state.workoutLogs.map((log: DashboardState["workoutLogs"][number]) => ({
              id: log.id,
              title: log.title,
              scheduledDate: log.scheduledDate.toISOString(),
              completed: log.completed,
              notes: log.notes,
            }))}
          />
          <CalendarPanel
            items={state.calendarItems.map((item: DashboardState["calendarItems"][number]) => ({
              id: item.id,
              title: item.title,
              dueDate: item.dueDate.toISOString(),
              completed: item.completed,
            }))}
          />
        </div>
      </section>
    </main>
  );
}
