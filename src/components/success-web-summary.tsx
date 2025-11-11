import { formatDistanceToNow } from "date-fns";

export type FeatureSelection = {
  calendar: boolean;
  journal: boolean;
  aiWorkout: boolean;
  sleep: boolean;
  createdAt: string;
};

type SuccessWebSummaryProps = {
  selection: FeatureSelection | null;
  latestWorkout: {
    id: string;
    programName: string;
    createdAt: string;
    artifactPath: string;
    hasRenderablePlan: boolean;
  } | null;
};

export function SuccessWebSummary({ selection, latestWorkout }: SuccessWebSummaryProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/60 via-emerald-900/20 to-transparent p-6 text-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Success Web Overview</h2>
        <p className="text-sm text-white/70">
          Neural Adapt celebrates progress and keeps all active modules in view so you can stay proactive.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Active Modules</h3>
          {selection ? (
            <ul className="mt-2 space-y-1 text-sm">
              <li className={selection.calendar ? "text-emerald-300" : "text-white/60"}>
                Calendar & tasks {selection.calendar ? "✓" : "—"}
              </li>
              <li className={selection.journal ? "text-emerald-300" : "text-white/60"}>
                Daily journal {selection.journal ? "✓" : "—"}
              </li>
              <li className={selection.aiWorkout ? "text-emerald-300" : "text-white/60"}>
                AI workout programmer {selection.aiWorkout ? "✓" : "—"}
              </li>
              <li className={selection.sleep ? "text-emerald-300" : "text-white/60"}>
                Sleep tracking {selection.sleep ? "✓" : "Preview"}
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-white/70">Select your starting modules to activate the Success Web.</p>
          )}
          {selection ? (
            <p className="mt-3 text-xs text-white/60">
              Updated {formatDistanceToNow(new Date(selection.createdAt), { addSuffix: true })}
            </p>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Latest AI Workout Plan</h3>
          {latestWorkout ? (
            <div className="mt-2 text-sm">
              <p className="font-semibold text-white">{latestWorkout.programName}</p>
              <p className="text-xs text-white/60">
                Generated {formatDistanceToNow(new Date(latestWorkout.createdAt), { addSuffix: true })}
              </p>
              <a
                href={`/api/workout-artifacts/${latestWorkout.id}`}
                className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200"
              >
                Download Excel Export
              </a>
              {latestWorkout.hasRenderablePlan ? (
                <a
                  href="#workout-plan"
                  className="mt-2 inline-flex items-center gap-2 text-sm text-indigo-300 hover:text-indigo-200"
                >
                  View In Dashboard
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/70">
              Generate a plan to see it featured here, complete with Excel export links.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
