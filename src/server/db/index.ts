import { PrismaClient } from "./client/client";

// Ensure prisma/data exists when running inside Next dev so SQLite file is reachable.
import fs from "node:fs";
import path from "node:path";

const dbDir = path.join(process.cwd(), "prisma", "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
