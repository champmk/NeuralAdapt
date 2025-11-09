import "./_env";

import { differenceInDays, formatDistanceToNow, subDays } from "date-fns";

import { env } from "../src/lib/env";
import { prisma } from "../src/server/db";
import { getOpenAIClient, trackEstimatedUsage } from "../src/server/services/openai";
import { getDemoUser } from "../src/server/utils/get-demo-user";

type JournalAnalysisResult = {
  entryId: string;
  sentiment: number;
  label: string;
  tones: string[];
  stressors: string[];
  urgency: string;
  summary: string;
};

async function scoreJournalEntries(userId: string): Promise<JournalAnalysisResult[]> {
  const recentEntries = await prisma.journalEntry.findMany({
    where: {
      userId,
      createdAt: {
        gte: subDays(new Date(), 3),
      },
    },
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  if (recentEntries.length === 0) {
    return [];
  }

  const openai = getOpenAIClient();
  trackEstimatedUsage(recentEntries.length);

  const schema = {
    name: "journal_sentiment_enriched",
    schema: {
      type: "object",
      properties: {
        sentiment: { type: "number", minimum: -1, maximum: 1 },
        label: { type: "string", enum: ["Positive", "Neutral", "Negative"] },
        tones: {
          type: "array",
          items: { type: "string" },
        },
        stressors: {
          type: "array",
          items: { type: "string" },
        },
        urgency: { type: "string", enum: ["None", "Low", "Medium", "High", "Critical"] },
        summary: { type: "string" },
      },
  required: ["sentiment", "label", "tones", "stressors", "urgency", "summary"],
      additionalProperties: false,
    },
    strict: true,
  } as const;

  const results: JournalAnalysisResult[] = [];

  for (const entry of recentEntries) {
    try {
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        input: [
          {
            role: "system",
            content:
              "You are a mental health copilot that rates sentiment on a scale of -1 to 1 and classifies it as Positive, Neutral, or Negative.",
          },
          {
            role: "user",
            content:
              `Journal entry: "${entry.content}". Evaluate the tone, urgency, and primary stressors. Reply in JSON that includes sentiment (-1 to 1), label (Positive|Neutral|Negative), tones (array of concise emotional descriptors), stressors (array of distinct stress triggers mentioned), urgency (None|Low|Medium|High|Critical), and a one sentence summary contextualizing the entry. Always include every field even if arrays are empty or urgency is None.`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: schema.name,
            schema: schema.schema,
            strict: schema.strict,
          },
        },
      } as unknown as Parameters<typeof openai.responses.create>[0]);

      const resultText = (response as { output_text?: string }).output_text;
      const payload = JSON.parse(resultText ?? "{}");
      const tones = Array.isArray(payload.tones)
        ? payload.tones.filter((tone: unknown) => typeof tone === "string")
        : [];
      const stressors = Array.isArray(payload.stressors)
        ? payload.stressors.filter((item: unknown) => typeof item === "string")
        : [];
      const sentimentValue = typeof payload.sentiment === "number" ? payload.sentiment : 0;
      const labelValue = typeof payload.label === "string" ? payload.label : "Neutral";
      const urgencyValue = typeof payload.urgency === "string" ? payload.urgency : "Low";
      const summaryValue = typeof payload.summary === "string" ? payload.summary : "";

      await prisma.journalEntry.update({
        where: { id: entry.id },
        data: {
          sentiment: sentimentValue,
          positivityTag: [labelValue, tones[0]].filter(Boolean).join(" • ") || labelValue,
        },
      });

      results.push({
        entryId: entry.id,
        sentiment: sentimentValue,
        label: labelValue,
        tones,
        stressors,
        urgency: urgencyValue,
        summary: summaryValue,
      });
    } catch (error) {
      console.error("Failed to score journal entry", entry.id, error);
    }
  }

  return results;
}

function computeAverages(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

async function maybeCreateFinding(userId: string, type: "ALERT" | "REINFORCEMENT", title: string, message: string, severity: number) {
  const existing = await prisma.analyzerFinding.findFirst({
    where: {
      userId,
      type,
      title,
      createdAt: {
        gte: subDays(new Date(), 1),
      },
    },
  });

  if (existing) {
    return prisma.analyzerFinding.update({
      where: { id: existing.id },
      data: {
        message,
        severity,
        createdAt: new Date(),
      },
    });
  }

  return prisma.analyzerFinding.create({
    data: {
      userId,
      type,
      title,
      message,
      severity,
    },
  });
}

async function runAnalyzer() {
  const user = await getDemoUser();

  const journalInsights = await scoreJournalEntries(user.id);

  const journals = await prisma.journalEntry.findMany({
    where: { userId: user.id, createdAt: { gte: subDays(new Date(), 7) } },
  });
  const workouts = await prisma.workoutLog.findMany({ where: { userId: user.id } });
  const calendarItems = await prisma.calendarItem.findMany({ where: { userId: user.id } });

  type JournalRecord = (typeof journals)[number];
  type WorkoutRecord = (typeof workouts)[number];
  type CalendarRecord = (typeof calendarItems)[number];

  const sentimentAverage = computeAverages(
    journals.map((entry: JournalRecord) => (typeof entry.sentiment === "number" ? entry.sentiment : 0)),
  );
  const negativeEntries = journals.filter((entry: JournalRecord) => (entry.sentiment ?? 0) < -0.25).length;
  const overdueWorkouts = workouts.filter(
    (workout: WorkoutRecord) => !workout.completed && workout.scheduledDate < new Date(),
  );
  const overdueTasks = calendarItems.filter(
    (item: CalendarRecord) => !item.completed && differenceInDays(new Date(), item.dueDate) >= 0,
  );

  const urgentEntries = journalInsights.filter((entry) => ["High", "Critical"].includes(entry.urgency));
  const intenseToneEntries = journalInsights.filter((entry) =>
    entry.tones.some((tone) => /(anxious|overwhelmed|angry|stressed|burned|panic|fear)/i.test(tone)),
  );
  const positiveToneEntries = journalInsights.filter((entry) =>
    entry.label === "Positive" || entry.tones.some((tone) => /(calm|grateful|motivated|confident|proud|energized)/i.test(tone)),
  );

  const stressorFrequency = new Map<string, number>();
  journalInsights.forEach((entry) => {
    entry.stressors.forEach((stressor) => {
      const key = stressor.trim();
      if (!key) {
        return;
      }
      stressorFrequency.set(key, (stressorFrequency.get(key) ?? 0) + 1);
    });
  });

  const topStressors = Array.from(stressorFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

  const intenseToneMap = new Map<string, string>();
  intenseToneEntries.forEach((entry) => {
    entry.tones.forEach((tone) => {
      if (/(anxious|overwhelmed|angry|stressed|burned|panic|fear)/i.test(tone)) {
        const key = tone.trim().toLowerCase();
        if (key && !intenseToneMap.has(key)) {
          intenseToneMap.set(key, tone.trim());
        }
      }
    });
  });
  const uniqueIntenseTones = Array.from(intenseToneMap.values());

  const alertTriggered =
    sentimentAverage < -0.2 ||
    negativeEntries >= 2 ||
    overdueWorkouts.length >= 2 ||
    urgentEntries.length > 0 ||
    intenseToneEntries.length >= 2;

  if (alertTriggered) {
    const messageParts = [] as string[];
    if (sentimentAverage < -0.2) {
      messageParts.push(`Mood trending down with average sentiment ${sentimentAverage.toFixed(2)} across last 7 days.`);
    }
    if (negativeEntries >= 2) {
      messageParts.push(`${negativeEntries} journal entries flagged as negative in the last week.`);
    }
    if (overdueWorkouts.length >= 2) {
      messageParts.push(`${overdueWorkouts.length} workouts overdue. Next session was ${formatDistanceToNow(overdueWorkouts[0].scheduledDate, { addSuffix: true })}.`);
    }
    if (overdueTasks.length >= 3) {
      messageParts.push(`${overdueTasks.length} tasks are behind schedule.`);
    }
    if (urgentEntries.length > 0) {
      messageParts.push(`${urgentEntries.length} journal entries flagged high urgency by tone analysis.`);
      if (urgentEntries[0]?.summary) {
        messageParts.push(`Most urgent note: "${urgentEntries[0].summary}"`);
      }
    }
    if (uniqueIntenseTones.length > 0) {
      messageParts.push(`Intense emotional tones detected (${uniqueIntenseTones.join(", ")}).`);
    }
    if (topStressors.length > 0) {
      messageParts.push(`Recurring stressors: ${topStressors.join(", ")}.`);
    }

    await maybeCreateFinding(
      user.id,
      "ALERT",
      "Early Strain Detected",
      messageParts.join(" ") || "Signals indicate mounting strain across multiple data sources.",
      Math.min(5, 2 + overdueWorkouts.length + negativeEntries + urgentEntries.length * 2 + (intenseToneEntries.length > 0 ? 1 : 0)),
    );
  } else if (
    sentimentAverage > 0.25 &&
    overdueWorkouts.length === 0 &&
    overdueTasks.length <= 1 &&
    urgentEntries.length === 0 &&
    negativeEntries === 0
  ) {
    const messageParts = [] as string[];
    if (sentimentAverage > 0.2) {
      messageParts.push(`Great emotional momentum with average sentiment ${sentimentAverage.toFixed(2)}.`);
    }
    if (overdueWorkouts.length === 0 && workouts.length > 0) {
      messageParts.push("All scheduled workouts are on track—consistency unlocked.");
    }
    if (calendarItems.length > 0 && overdueTasks.length === 0) {
      messageParts.push("Calendar commitments are all current.");
    }
    if (positiveToneEntries.length > 0) {
      messageParts.push(`${positiveToneEntries.length} journal entries reflected optimistic or grounded tone.`);
    }
    if (journalInsights.length > 0 && journalInsights.every((entry) => ["None", "Low"].includes(entry.urgency))) {
      messageParts.push("Journal urgency remained low across recent reflections.");
    }
    if (topStressors.length === 0) {
      messageParts.push("No recurring stressors detected in recent journal entries.");
    }

    await maybeCreateFinding(
      user.id,
      "REINFORCEMENT",
      "Progress Momentum",
      messageParts.join(" ") || "Positive adherence detected—keep reinforcing these routines!",
      2,
    );
  }

  console.log("Analyzer run complete", {
    sentimentAverage,
    negativeEntries,
    overdueWorkouts: overdueWorkouts.length,
    overdueTasks: overdueTasks.length,
    urgentJournalEntries: urgentEntries.length,
    intenseToneEntries: intenseToneEntries.length,
    topStressors,
    openaiBudgetCents: env.OPENAI_MAX_DAILY_CENTS,
  });
}

runAnalyzer().catch((error) => {
  console.error("Analyzer run failed", error);
  process.exitCode = 1;
});
