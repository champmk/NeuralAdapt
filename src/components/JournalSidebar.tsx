'use client';

import Link from "next/link";
import { format } from "date-fns";

import GlowButton from "@/components/GlowButton";

type SidebarEntry = {
  id: string;
  content: string;
  createdAt: string;
  positivityTag: string | null;
};

type JournalSidebarProps = {
  entries: SidebarEntry[];
  showDashboardLink?: boolean;
  className?: string;
  onSelectEntry?: (entry: SidebarEntry) => void;
  selectedEntryId?: string | null;
};

function extractPreview(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= 80) {
    return normalized;
  }
  return normalized.slice(0, 77).trimEnd() + "…";
}

export default function JournalSidebar({ entries, showDashboardLink = false, className, onSelectEntry, selectedEntryId = null }: JournalSidebarProps) {
  const baseClass = "flex h-full w-full max-w-xs flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/60 p-6 text-white backdrop-blur";
  const resolvedClassName = className ? `${baseClass} ${className}` : baseClass;
  return (
    <aside className={resolvedClassName}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Daily Journal</p>
            <h2 className="mt-1 text-lg font-semibold">Reflection Threads</h2>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {showDashboardLink ? (
            <GlowButton href="/dashboard" label="Dashboard" />
          ) : null}
          <GlowButton href="/journal/new" label="New Chat" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col gap-3 overflow-y-auto pr-2">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Your reflections will appear here once you start journaling.
            </div>
          ) : (
            entries.map((entry) => {
              const entryIsSelected = selectedEntryId === entry.id;
              const baseEntryClass =
                "group block rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-emerald-300/40 hover:bg-emerald-400/10";
              const selectedClass = entryIsSelected ? " border-emerald-300/60 bg-emerald-400/15" : "";
              const sharedClassName = `${baseEntryClass}${selectedClass}`;

              const content = (
                <>
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                    <span>{format(new Date(entry.createdAt), "MMM d, yyyy • h:mm a")}</span>
                    {entry.positivityTag ? (
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80">{entry.positivityTag}</span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-white/80 group-hover:text-white">{extractPreview(entry.content)}</p>
                </>
              );

              if (onSelectEntry) {
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelectEntry(entry)}
                    className={`${sharedClassName} w-full text-left`}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link key={entry.id} href={`/journal/new?from=${entry.id}`} className={sharedClassName}>
                  {content}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
