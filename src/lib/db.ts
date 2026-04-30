import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Vercel (production) → Neon adapter (HTTP 기반, serverless 호환)
  // 로컬 (development) → pg adapter (TCP 기반)
  if (process.env.VERCEL) {
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
    return new PrismaClient({ adapter });
  } else {
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    return new PrismaClient({ adapter });
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// SQLite (로컬 개발, SQLite로 돌릴 때) — 필요 시 위를 주석하고 아래 주석 해제
// import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// import path from "path";
// const dbPath = path.join(process.cwd(), "prisma", "dev.db");
// function createPrismaClient() {
//   const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
//   return new PrismaClient({ adapter });
// }
// export const prisma = globalForPrisma.prisma || createPrismaClient();
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
