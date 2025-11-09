"use client";

import { format } from "date-fns";
import { useFormStatus } from "react-dom";

import { createJournalEntry } from "@/app/actions";

type JournalEntry = {
  id: string;
  content: string;
  createdAt: string;
  sentiment: number | null;
  positivityTag: string | null;
};

type JournalPanelProps = {
  entries: JournalEntry[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-progress disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving..." : "Log Reflection"}
    </button>
  );
}

export function JournalPanel({ entries }: JournalPanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Daily Journal</h2>
        <p className="text-sm text-white/70">
          Capture a quick reflection. The analyzer will assess tone shifts and surface alerts or reinforcement.
        </p>
      </div>

      <form action={createJournalEntry} className="mt-4 space-y-3">
        <textarea
          name="content"
          rows={3}
          required
          placeholder="What felt energizing today? What drained you?"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white/60">
            Your reflections will appear here once you start journaling.
          </div>
        ) : (
          entries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm backdrop-blur"
            >
              <header className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                <span>{format(new Date(entry.createdAt), "MMM d, yyyy • h:mm a")}</span>
                {entry.positivityTag ? (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80">
                    {entry.positivityTag}
                  </span>
                ) : null}
              </header>
              <p className="mt-2 text-white/90">{entry.content}</p>
              {typeof entry.sentiment === "number" ? (
                <footer className="mt-2 text-xs text-white/60">
                  Sentiment score: {entry.sentiment.toFixed(2)}
                </footer>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
