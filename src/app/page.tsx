import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen text-white">
      <section className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300">Agentic wellness companion</p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight drop-shadow-md md:text-6xl">
          Neural Adapt keeps a pulse on your mental and physical health—intervening before you hit the wall.
        </h1>
        <p className="max-w-2xl text-base text-white/80 md:text-lg">
          Configure the modules you want, generate AI-personalized workouts powered by OpenAI, and let the analyzer agent surface timely
          warnings or reinforcement inside the Success Web dashboard.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/start"
            className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
          >
            Start Now
          </Link>
          <Link href="/dashboard" className="text-sm font-medium text-white/70 underline-offset-4 hover:text-white">
            View the dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
