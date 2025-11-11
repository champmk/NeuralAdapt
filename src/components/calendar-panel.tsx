"use client";

import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { KeyboardEvent, useMemo, useState, useTransition } from "react";

import { createCalendarItem, toggleCalendarItemCompletion } from "@/app/actions";

export type CalendarItem = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  interactive?: boolean;
  tag?: string;
  description?: string | null;
};

type CalendarPanelProps = {
  items: CalendarItem[];
};

type CalendarEntry = CalendarItem & { due: Date; interactive: boolean; description: string | null };

export function CalendarPanel({ items }: CalendarPanelProps) {
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState(() => today);
  const [isPending, startTransition] = useTransition();
  const now = new Date();

  const parsedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        interactive: item.interactive ?? true,
        description: item.description ?? null,
        due: new Date(item.dueDate)
      } as CalendarEntry)),
    [items]
  );

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    parsedItems.forEach((item) => {
      const key = format(item.due, "yyyy-MM-dd");
      const existing = map.get(key);
      if (existing) {
        existing.push(item);
      } else {
        map.set(key, [item]);
      }
    });
    return map;
  }, [parsedItems]);

  const actionableItems = useMemo(() => parsedItems.filter((item) => item.interactive !== false), [parsedItems]);

  const stats = useMemo(() => {
    if (actionableItems.length === 0) {
      return { total: 0, completed: 0, completionRate: 0 };
    }
    const completed = actionableItems.filter((item) => item.completed).length;
    return {
      total: actionableItems.length,
      completed,
      completionRate: Math.round((completed / actionableItems.length) * 100)
    };
  }, [actionableItems]);

  const todoItems = useMemo(() => {
    const pending = parsedItems
      .filter((item) => !item.completed)
      .sort((a, b) => a.due.getTime() - b.due.getTime());

    return pending.slice(0, 5);
  }, [parsedItems]);

  const calendarDays = useMemo(() => {
    const rangeStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const rangeEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

    const days: Date[] = [];
    let cursor = rangeStart;

    while (cursor <= rangeEnd) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }

    return days;
  }, [currentMonth]);

  const handleNavigate = (direction: 1 | -1) => {
    setCurrentMonth((prev) => addMonths(prev, direction));
  };

  const handleToggle = (item: CalendarEntry) => {
    if (item.interactive === false) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("itemId", item.id);
      formData.append("completed", String(!item.completed));
      await toggleCalendarItemCompletion(formData);
    });
  };

  const handleSelectDay = (day: Date) => {
    setSelectedDay(startOfDay(day));
  };

  const handleSelectDayKey = (event: KeyboardEvent<HTMLDivElement>, day: Date) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelectDay(day);
    }
  };

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        format(addDays(startOfWeek(today, { weekStartsOn: 0 }), index), "EEE")
      ),
    [today]
  );

  const selectedDayItems = useMemo(() => {
    const key = format(selectedDay, "yyyy-MM-dd");
    const entries = itemsByDay.get(key) ?? ([] as CalendarEntry[]);
    return [...entries].sort((a, b) => a.due.getTime() - b.due.getTime());
  }, [itemsByDay, selectedDay]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Calendar & Todo Snapshot</h2>
        <p className="text-sm text-white/70">
          Plan workload, recovery, and follow-ups. Analyzer trends include missed or overloaded days.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-white/50">Total</p>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-white/50">Completed</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-300">{stats.completed}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-white/50">Completion Rate</p>
          <p className="mt-1 text-2xl font-semibold text-white">{stats.completionRate}%</p>
        </div>
      </div>

      <form action={createCalendarItem} className="mt-6 grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
        <input
          required
          name="title"
          placeholder="Task or event"
          className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <input
          required
          name="dueDate"
          type="datetime-local"
          className="rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Add
        </button>
      </form>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</p>
              <p className="text-xs text-white/60">Tap a day to see scheduled tasks</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => handleNavigate(-1)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/40"
              >
                Prev
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => handleNavigate(1)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-white/60">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayItems = itemsByDay.get(key) ?? ([] as CalendarEntry[]);
              const isToday = isSameDay(day, today);
              const current = isSameMonth(day, currentMonth);
              const isSelected = isSameDay(day, selectedDay);
              const actionable = dayItems.filter((item) => item.interactive !== false);
              const completedCount = actionable.filter((item) => item.completed).length;
              const pendingCount = dayItems.filter((item) => !item.completed).length;

              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectDay(day)}
                  onKeyDown={(event) => handleSelectDayKey(event, day)}
                  className={`flex min-h-[110px] flex-col rounded-xl border px-3 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-500/10"
                      : isToday
                        ? "border-emerald-400/60 bg-emerald-500/5"
                        : "border-white/10 bg-black/30"
                  } ${current ? "" : "opacity-40"}`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-white">{format(day, "d")}</span>
                    {dayItems.length > 0 ? (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                        {pendingCount > 0 ? `${pendingCount} pending` : `${completedCount} done`}
                      </span>
                    ) : null}
                  </div>

                  {dayItems.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1">
                      {dayItems.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className={`truncate rounded-md px-2 py-1 text-[11px] font-medium ${
                            item.completed
                              ? "bg-emerald-500/20 text-emerald-200 line-through"
                              : "bg-white/10 text-white"
                          }`}
                        >
                          {item.title}
                        </div>
                      ))}
                      {dayItems.length > 2 ? (
                        <span className="text-[10px] text-white/60">+{dayItems.length - 2} more</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-semibold text-white">To-Do</p>
            <p className="text-xs text-white/60">Next five commitments that still need attention</p>

            <div className="mt-3 space-y-3">
              {todoItems.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white/60">
                  Nothing pending at the moment—nice work.
                </div>
              ) : (
                todoItems.map((item) => {
                  const isPastDue = item.due.getTime() < now.getTime();

                  return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/40 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-white/60">{format(item.due, "MMM d, yyyy h:mm a")}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-white/70">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <div className="flex flex-row items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            item.tag === "Plan"
                              ? "bg-sky-500/20 text-sky-200"
                              : isPastDue
                                ? "bg-rose-500/20 text-rose-200"
                                : "bg-amber-500/20 text-amber-200"
                          }`}
                        >
                          {item.tag ?? (isPastDue ? "Past Due" : "Pending")}
                        </span>
                        {item.interactive !== false ? (
                          <button
                            type="button"
                            onClick={() => handleToggle(item)}
                            disabled={isPending}
                            className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-emerald-400 hover:text-emerald-200 disabled:pointer-events-none disabled:opacity-50"
                          >
                            {item.completed ? "Mark Pending" : "Mark Complete"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm font-semibold text-white">
              {format(selectedDay, "MMM d, yyyy")} Tasks
            </p>
            <p className="text-xs text-white/60">Chronological view of everything scheduled that day</p>

            <div className="mt-3 space-y-3">
              {selectedDayItems.length === 0 ? (
                <div className="rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-white/60">
                  No tasks on this day yet.
                </div>
              ) : (
                selectedDayItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-black/40 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        {item.tag ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            item.tag === "Plan" ? "bg-sky-500/20 text-sky-200" : "bg-emerald-500/20 text-emerald-200"
                          }`}>{item.tag}</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-white/60">{format(item.due, "h:mm a")}</p>
                      {item.description ? (
                        <p className="mt-1 text-xs text-white/70">{item.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          item.completed
                            ? "bg-emerald-500/20 text-emerald-200"
                            : item.due.getTime() < now.getTime()
                              ? "bg-rose-500/20 text-rose-200"
                              : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {item.completed ? "Completed" : item.due.getTime() < now.getTime() ? "Past Due" : "Pending"}
                      </span>
                      {item.interactive !== false ? (
                        <button
                          type="button"
                          onClick={() => handleToggle(item)}
                          disabled={isPending}
                          className="rounded-full border border-white/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-emerald-400 hover:text-emerald-200 disabled:pointer-events-none disabled:opacity-50"
                        >
                          {item.completed ? "Mark Pending" : "Mark Complete"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
