"use client";

import { format } from "date-fns";

import { createCalendarItem } from "@/app/actions";

export type CalendarItem = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

type CalendarPanelProps = {
  items: CalendarItem[];
};

export function CalendarPanel({ items }: CalendarPanelProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Calendar & Todo Snapshot</h2>
        <p className="text-sm text-white/70">
          Track commitments that reinforce accountability. Missed tasks inform the analyzer.
        </p>
      </div>

      <form action={createCalendarItem} className="mt-4 grid gap-3 md:grid-cols-3">
        <input
          required
          name="title"
          placeholder="Task or event"
          className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          required
          name="dueDate"
          type="date"
          className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <div className="md:col-span-1 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Add
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white/60">
            Plan a task or recovery block to see it here.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-white">{item.title}</span>
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {format(new Date(item.dueDate), "MMM d, yyyy")}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/50">{item.completed ? "Completed" : "Pending"}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
