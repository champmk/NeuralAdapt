export const dynamic = "force-dynamic";

import { addDays } from "date-fns";

import { AnalyzerFeed } from "@/components/analyzer-feed";
import { CalendarPanel, type CalendarItem } from "@/components/calendar-panel";
import GlowButton from "@/components/GlowButton";
import JournalSidebar from "@/components/JournalSidebar";
import { SuccessWebSummary } from "@/components/success-web-summary";
import { WorkoutPlanViewer } from "@/components/workout-plan-viewer";
import { getDashboardState } from "@/server/services/dashboard";
import { workoutPlanSchema, type WorkoutPlan } from "@/server/services/workouts";

type DashboardState = Awaited<ReturnType<typeof getDashboardState>>;

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

function derivePlanCalendarItems(plan: WorkoutPlan, planId: string): CalendarItem[] {
  const startDate = new Date(plan.startDate);
  if (Number.isNaN(startDate.getTime())) {
    return [];
  }

  const baseDayIndex = startDate.getDay();

  return plan.weeks.flatMap((week) => {
    const weekStart = addDays(startDate, (week.week - 1) * 7);

    return week.sessions.map((session, sessionIndex) => {
      const dayMatch = session.day.match(/(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i);
      let sessionDate = addDays(weekStart, sessionIndex);

      if (dayMatch) {
        const matchedName = dayMatch[1].toLowerCase();
        const targetIndex = DAY_NAMES.indexOf(matchedName as (typeof DAY_NAMES)[number]);
        if (targetIndex >= 0) {
          const offset = (targetIndex - baseDayIndex + 7) % 7;
          sessionDate = addDays(weekStart, offset);
        }
      }

      sessionDate.setHours(7, 0, 0, 0);

      return {
        id: `plan-${planId}-w${week.week}-s${sessionIndex}`,
        title: session.day,
        description: session.emphasis,
        dueDate: sessionDate.toISOString(),
        completed: false,
        interactive: false,
        tag: "Plan",
      } satisfies CalendarItem;
    });
  });
}

export default async function DashboardPage() {
  const state: DashboardState = await getDashboardState();

  const parsedPlan = state.latestWorkoutPlan
    ? (() => {
        const rawPayload = state.latestWorkoutPlan.responsePayload;
        const normalizedPayload =
          rawPayload && typeof rawPayload === "object"
            ? {
                ...rawPayload,
                athleteProfile: {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ...(((rawPayload as any).athleteProfile as Record<string, unknown>) ?? {}),
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  constraints: Array.isArray((rawPayload as any)?.athleteProfile?.constraints)
                    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ((rawPayload as any).athleteProfile.constraints as string[])
                    : [],
                },
              }
            : rawPayload;

        const validation = workoutPlanSchema.safeParse(normalizedPayload);
        return validation.success ? validation.data : null;
      })()
    : null;

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
        programName: parsedPlan?.programName ?? "AI Workout",
        createdAt: state.latestWorkoutPlan.createdAt.toISOString(),
        artifactPath: state.latestWorkoutPlan.artifactPath,
        hasRenderablePlan: Boolean(parsedPlan),
      }
    : null;

  const showWorkoutGenerator = latestSelection?.aiWorkout ?? false;

  const moduleMetadata: Array<{ key: "calendar" | "journal" | "aiWorkout" | "sleep"; label: string }> = [
    { key: "calendar", label: "Calendar + Task Tracker" },
    { key: "journal", label: "Guided Daily Journal" },
    { key: "aiWorkout", label: "AI Workout Programmer" },
    { key: "sleep", label: "Sleep Tracking (Preview)" },
  ];

  const enabledModules = latestSelection
    ? moduleMetadata.filter((module) => latestSelection[module.key])
    : [];

  const baseCalendarItems: CalendarItem[] = state.calendarItems.map((item: DashboardState["calendarItems"][number]) => ({
    id: item.id,
    title: item.title,
    dueDate: item.dueDate.toISOString(),
    completed: item.completed,
    interactive: true,
  }));

  const planCalendarItems = parsedPlan && state.latestWorkoutPlan ? derivePlanCalendarItems(parsedPlan, state.latestWorkoutPlan.id) : [];

  const combinedCalendarItems = [...baseCalendarItems, ...planCalendarItems].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <main className="relative min-h-screen text-white lg:pl-[360px]">
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-30 flex w-[320px] overflow-y-auto px-6 py-10">
          <JournalSidebar
            className="max-w-none"
            entries={state.journalEntries.map((entry: DashboardState["journalEntries"][number]) => ({
              id: entry.id,
              content: entry.content,
              createdAt: entry.createdAt.toISOString(),
              positivityTag: entry.positivityTag,
            }))}
          />
        </div>
      </div>

      <section className="px-4 py-12 lg:px-8">
        <div className="mb-10 lg:hidden">
          <JournalSidebar
            entries={state.journalEntries.map((entry: DashboardState["journalEntries"][number]) => ({
              id: entry.id,
              content: entry.content,
              createdAt: entry.createdAt.toISOString(),
              positivityTag: entry.positivityTag,
            }))}
          />
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <SuccessWebSummary selection={latestSelection} latestWorkout={latestWorkout} />

          {parsedPlan ? <WorkoutPlanViewer plan={parsedPlan} /> : null}

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-900/40 to-transparent p-6 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Module Selection</p>
                <div>
                  <h2 className="text-xl font-semibold text-white">Choose your Neural Adapt modules</h2>
                  <p className="mt-2 max-w-xl text-sm text-white/70">
                    Launch the guided stepper to toggle feature modules and tailor the dashboard experience to what you want to explore.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {enabledModules.length > 0 ? (
                    enabledModules.map((module) => (
                      <span
                        key={module.key}
                        className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100"
                      >
                        {module.label}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      No modules enabled yet
                    </span>
                  )}
                </div>
              </div>
              <GlowButton href="/start" label="Configure Modules" />
            </div>
          </div>

          {showWorkoutGenerator ? (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-900/40 to-transparent p-6 shadow-xl backdrop-blur">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">AI Workout Programmer Intake</p>
                  <h2 className="text-xl font-semibold text-white">Ready for your next training block?</h2>
                  <p className="max-w-xl text-sm text-white/70">
                    Launch the guided stepper to collect training context and let OpenAI craft a fresh, export-ready plan tailored to your goals.
                  </p>
                </div>
                <GlowButton href="/start?mode=workout" label="Generate Workout" />
              </div>
            </div>
          ) : null}

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

          <CalendarPanel items={combinedCalendarItems} />
        </div>
      </section>
    </main>
  );
}
