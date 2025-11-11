"use client";

import { useMemo, useState } from "react";

import type { WorkoutPlan } from "@/server/services/workouts";

type WorkoutPlanViewerProps = {
  plan: WorkoutPlan;
};

export function WorkoutPlanViewer({ plan }: WorkoutPlanViewerProps) {
  const [activeWeek, setActiveWeek] = useState(() => (plan.weeks.length > 0 ? plan.weeks[0].week : null));

  const selectedWeek = useMemo(() => {
    if (activeWeek == null) {
      return null;
    }

    return plan.weeks.find((week) => week.week === activeWeek) ?? null;
  }, [activeWeek, plan]);

  return (
    <section id="workout-plan" className="rounded-3xl border border-white/10 bg-black/50 p-6 text-white">
      <header className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Program Blueprint</h2>
        <p className="text-sm text-white/70">
          {plan.programName} | {plan.trainingFocus} | {plan.programType}
        </p>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          {plan.startDate} to {plan.endDate} | {plan.cycleLengthWeeks} week cycle
        </p>
      </header>

      <div className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Methodology</h3>
            <dl className="mt-2 grid gap-2 text-sm text-white/80 md:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/50">Periodization</dt>
                <dd>{plan.methodology.periodizationModel}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/50">Volume Strategy</dt>
                <dd>{plan.methodology.volumeStrategy}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/50">Intensity Strategy</dt>
                <dd>{plan.methodology.intensityStrategy}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/50">Frequency Strategy</dt>
                <dd>{plan.methodology.frequencyStrategy}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Phases</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {plan.phases.map((phase) => (
                <div key={phase.name} className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <p className="text-sm font-semibold text-white">{phase.name}</p>
                  <p className="mt-1 text-xs text-white/60">
                    Weeks {phase.startWeek} - {phase.endWeek}
                    {phase.deloadWeek != null ? ` | Deload: Week ${phase.deloadWeek}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-white/70">Objectives</p>
                  <ul className="mt-1 space-y-1 text-xs text-white/80">
                    {phase.objectives.map((objective) => (
                      <li key={objective}>- {objective}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-white/70">Key Metrics</p>
                  <ul className="mt-1 space-y-1 text-xs text-white/80">
                    {phase.keyMetrics.map((metric) => (
                      <li key={metric}>- {metric}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Athlete Profile</h3>
            <p className="mt-2 text-sm text-white/80">{plan.athleteProfile.summary}</p>
            <p className="mt-3 text-xs text-white/70">Primary Goals</p>
            <ul className="mt-1 space-y-1 text-xs text-white/80">
              {plan.athleteProfile.primaryGoals.map((goal) => (
                <li key={goal}>- {goal}</li>
              ))}
            </ul>
            {plan.athleteProfile.constraints && plan.athleteProfile.constraints.length > 0 ? (
              <>
                <p className="mt-3 text-xs text-white/70">Constraints</p>
                <ul className="mt-1 space-y-1 text-xs text-white/80">
                  {plan.athleteProfile.constraints.map((constraint) => (
                    <li key={constraint}>- {constraint}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Monitoring Playbook</h3>
            <div className="mt-2 space-y-3 text-sm text-white/80">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Readiness Checks</p>
                <ul className="mt-1 space-y-1 text-xs text-white/80">
                  {plan.monitoring.readinessChecks.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Nutrition Focus</p>
                <ul className="mt-1 space-y-1 text-xs text-white/80">
                  {plan.monitoring.nutritionFocus.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white/50">Recovery Protocols</p>
                <ul className="mt-1 space-y-1 text-xs text-white/80">
                  {plan.monitoring.recoveryProtocols.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">Coaching Notes</h3>
            <ul className="mt-2 space-y-2 text-sm text-white/80">
              {plan.coachingNotes.map((note) => (
                <li key={note} className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/70">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {plan.weeks.map((week) => {
            const isActive = week.week === activeWeek;
            return (
              <button
                key={week.week}
                type="button"
                onClick={() => setActiveWeek(week.week)}
                className={`rounded-full border px-4 py-1 text-sm transition ${
                  isActive
                    ? "border-emerald-300 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/5 text-white/60 hover:border-emerald-200/60 hover:text-white"
                }`}
              >
                Week {week.week}
              </button>
            );
          })}
        </div>

        {selectedWeek ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-emerald-950/40 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-200">Week {selectedWeek.week}</h3>
                  <p className="text-sm text-white/70">{selectedWeek.focus}</p>
                </div>
                <div className="text-xs text-white/60">
                  <span className="font-semibold">Key outcomes: </span>
                  {selectedWeek.keyOutcomes.join(" | ")}
                </div>
              </div>
            </div>

            {selectedWeek.sessions.map((session) => (
              <div key={`${selectedWeek.week}-${session.day}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{session.day}</p>
                    <p className="text-xs text-white/60">{session.emphasis}</p>
                  </div>
                  <div className="text-xs text-white/60">
                    {session.sessionMinutes} min session
                  </div>
                </div>

                {session.readinessCues && session.readinessCues.length > 0 ? (
                  <p className="mt-3 text-xs text-emerald-200">
                    Readiness cues: {session.readinessCues.join(" | ")}
                  </p>
                ) : null}

                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">Main Lifts</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {session.mainLifts.map((lift) => (
                        <div key={lift.name} className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                          <p className="font-semibold text-white">{lift.name}</p>
                          <p className="text-xs text-white/60">
                            {lift.sets} sets x {lift.reps} reps | {lift.intensity}
                          </p>
                          <p className="text-xs text-white/60">Rest: {lift.rest}</p>
                          {lift.tempo || lift.notes ? (
                            <p className="mt-1 text-xs text-white/70">
                              {[lift.tempo ? `Tempo ${lift.tempo}` : null, lift.notes].filter(Boolean).join(" | ")}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {session.accessoryWork && session.accessoryWork.length > 0 ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Accessory Focus</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {session.accessoryWork.map((accessory) => (
                          <div key={accessory.name} className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                            <p className="font-semibold text-white">{accessory.name}</p>
                            <p className="text-xs text-white/60">
                              {accessory.sets} x {accessory.reps}
                            </p>
                            {accessory.notes ? (
                              <p className="mt-1 text-xs text-white/70">{accessory.notes}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {session.conditioning && session.conditioning.length > 0 ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Conditioning</p>
                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {session.conditioning.map((block) => (
                          <div key={block.modality} className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
                            <p className="font-semibold text-white">{block.modality}</p>
                            <p className="text-xs text-white/60">{block.durationMinutes} min</p>
                            {block.notes ? (
                              <p className="mt-1 text-xs text-white/70">{block.notes}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {session.recovery && session.recovery.length > 0 ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Recovery Emphasis</p>
                      <p className="mt-1 text-xs text-white/70">{session.recovery.join(" | ")}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/60">Select a week to review the detailed session breakdown.</p>
        )}
      </div>
    </section>
  );
}
