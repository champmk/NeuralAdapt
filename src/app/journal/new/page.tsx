export const dynamic = "force-dynamic";

import JournalComposerClient from "@/components/JournalComposerClient";
import { createJournalEntry } from "@/app/actions";
import { getDashboardState } from "@/server/services/dashboard";

type PageProps = {
  searchParams?: {
    from?: string;
    [key: string]: string | string[] | undefined;
  };
};

export default async function NewJournalPage({ searchParams }: PageProps) {
  const state = await getDashboardState();

  const sidebarEntries = state.journalEntries.map((entry) => ({
    id: entry.id,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    positivityTag: entry.positivityTag,
  }));

  const lastEntryRecord = state.journalEntries.at(0);
  const lastEntry = lastEntryRecord
    ? {
        content: lastEntryRecord.content,
        createdAt: lastEntryRecord.createdAt.toISOString(),
      }
    : null;

  const rawFrom = searchParams?.from;
  const initialSelectedId =
    typeof rawFrom === "string" ? rawFrom : Array.isArray(rawFrom) ? rawFrom[0] ?? null : null;

  return (
    <JournalComposerClient
      entries={sidebarEntries}
      lastEntry={lastEntry}
      createJournalEntry={createJournalEntry}
      initialSelectedId={initialSelectedId}
    />
  );
}
