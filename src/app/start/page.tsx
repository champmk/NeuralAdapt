import ModuleOnboarding from "@/components/ModuleOnboarding";
import { getDashboardState } from "@/server/services/dashboard";

export const dynamic = "force-dynamic";

type StartPageProps = {
  searchParams?: {
    mode?: string;
  };
};

export default async function StartPage({ searchParams }: StartPageProps) {
  const state = await getDashboardState();
  const forceWorkoutStep = searchParams?.mode === "workout";

  const latestSelection = state.latestSelection
    ? {
        calendar: state.latestSelection.calendar,
        journal: state.latestSelection.journal,
        aiWorkout: forceWorkoutStep ? true : state.latestSelection.aiWorkout,
        sleep: state.latestSelection.sleep,
      }
    : forceWorkoutStep
      ? {
          calendar: true,
          journal: true,
          aiWorkout: true,
          sleep: false,
        }
      : null;

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden text-white">
      <div className="flex w-full max-w-5xl items-center justify-center px-4 py-16 md:py-20">
        <ModuleOnboarding initialSelection={latestSelection} initialStep={forceWorkoutStep ? 2 : 1} forceWorkoutStep={forceWorkoutStep} />
      </div>
    </main>
  );
}
