import OpenAI from "openai";

import { env } from "@/lib/env";

const DEFAULT_BUDGET_CENTS = env.OPENAI_MAX_DAILY_CENTS ?? 800;

let client: OpenAI | undefined;
let usageState = {
  date: new Date().toISOString().slice(0, 10),
  cents: 0,
};

export function getOpenAIClient() {
  if (!client) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured. Set it in your .env file before invoking AI workloads.");
    }
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export function trackEstimatedUsage(cents: number) {
  const today = new Date().toISOString().slice(0, 10);
  if (usageState.date !== today) {
    usageState = { date: today, cents: 0 };
  }

  usageState.cents += cents;
  if (usageState.cents > DEFAULT_BUDGET_CENTS) {
    throw new Error(
      `Daily OpenAI budget exceeded. Spent ${usageState.cents} cents, limit ${DEFAULT_BUDGET_CENTS} cents.`,
    );
  }
}

export function getUsageSnapshot() {
  return usageState;
}
