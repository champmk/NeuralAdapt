import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MAX_DAILY_CENTS: z.coerce.number().optional(),
    DATABASE_URL: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().default("Neural Adapt"),
  },
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MAX_DAILY_CENTS: process.env.OPENAI_MAX_DAILY_CENTS,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  },
});
