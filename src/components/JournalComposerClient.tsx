'use client';

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { format } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import GlowButton from "@/components/GlowButton";
import JournalSidebar from "@/components/JournalSidebar";

type SidebarEntry = {
  id: string;
  content: string;
  createdAt: string;
  positivityTag: string | null;
};

type LastEntry = {
  content: string;
  createdAt: string;
};

type JournalComposerClientProps = {
  entries: SidebarEntry[];
  lastEntry: LastEntry | null;
  createJournalEntry: (formData: FormData) => Promise<void>;
  initialSelectedId?: string | null;
};

export default function JournalComposerClient({ entries, lastEntry, createJournalEntry, initialSelectedId = null }: JournalComposerClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(initialSelectedId);
  const [showPreview, setShowPreview] = useState(Boolean(initialSelectedId));
  const [composerValue, setComposerValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedEntry = useMemo(() => entries.find((entry) => entry.id === selectedEntryId) ?? null, [entries, selectedEntryId]);

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedEntryId(initialSelectedId);
      setShowPreview(true);
    }
  }, [initialSelectedId]);

  const updateQueryParam = (entryId: string | null) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    if (entryId) {
      params.set("from", entryId);
    } else {
      params.delete("from");
    }
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    router.replace(url, { scroll: false });
  };

  const handleSelectEntry = (entry: SidebarEntry) => {
    setSelectedEntryId(entry.id);
    setShowPreview(true);
    updateQueryParam(entry.id);
  };

  const handleEditSelected = () => {
    if (!selectedEntry) {
      return;
    }
    setComposerValue(selectedEntry.content);
    setShowPreview(false);
    updateQueryParam(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      createJournalEntry(formData)
        .then(() => {
          setComposerValue("");
          setSelectedEntryId(null);
          setShowPreview(false);
          updateQueryParam(null);
          formRef.current?.reset();
        })
        .catch((error) => {
          console.error("Failed to save journal entry", error);
        });
    });
  };

  return (
    <main className="relative min-h-screen text-white lg:pl-[360px]">
      <div className="hidden lg:block">
        <div className="fixed inset-y-0 left-0 z-30 flex w-[320px] overflow-y-auto px-6 py-10">
          <JournalSidebar
            className="max-w-none"
            entries={entries}
            onSelectEntry={handleSelectEntry}
            selectedEntryId={selectedEntryId}
          />
        </div>
      </div>

      <section className="px-4 py-12 lg:px-8">
        <div className="mb-8 lg:hidden">
          <JournalSidebar entries={entries} onSelectEntry={handleSelectEntry} selectedEntryId={selectedEntryId} />
        </div>

        <div className="mx-auto flex max-w-4xl flex-col gap-10">
          <div className="border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Journal Composer</p>
            <h1 className="mt-1 text-2xl font-semibold">Capture today&apos;s reflections</h1>
          </div>

          {lastEntry ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-white/60">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/40">
                <span>Last entry</span>
                <span>{format(new Date(lastEntry.createdAt), "MMM d, yyyy • h:mm a")}</span>
              </div>
              <p className="mt-2 text-white/70">{lastEntry.content}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-6 lg:flex-row">
            {showPreview && selectedEntry ? (
              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-xl backdrop-blur lg:w-[38%]">
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                  <span>{format(new Date(selectedEntry.createdAt), "MMM d, yyyy • h:mm a")}</span>
                  {selectedEntry.positivityTag ? (
                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/80">
                      {selectedEntry.positivityTag}
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/80">{selectedEntry.content}</p>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleEditSelected}
                    className="rounded-full border border-emerald-300/60 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-200 hover:text-white"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : null}

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col">
              <fieldset className="flex-1 rounded-3xl border border-white/10 bg-white/90 p-8 text-slate-900 shadow-2xl">
                <legend className="sr-only">New journal entry</legend>
                <textarea
                  name="content"
                  required
                  placeholder="Start reflecting…"
                  value={composerValue}
                  onChange={(event) => setComposerValue(event.target.value)}
                  className="min-h-[420px] w-full resize-none bg-transparent text-lg leading-relaxed outline-none placeholder:text-slate-400"
                />
              </fieldset>
              <div className="mt-6 flex justify-end gap-3">
                <GlowButton href="/dashboard" label="Dashboard" />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending ? "Saving…" : "Save Journal Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
