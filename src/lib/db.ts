import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// PostgreSQL (Supabase) — 현재 사용
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// SQLite (로컬 개발) — 필요 시 위를 주석하고 아래 주석 해제
// import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// import path from "path";
// const dbPath = path.join(process.cwd(), "prisma", "dev.db");
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
// function createPrismaClient() {
//   const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
//   return new PrismaClient({ adapter });
// }
// export const prisma = globalForPrisma.prisma || createPrismaClient();
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
