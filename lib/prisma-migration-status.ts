import "server-only";
import { prisma } from "./prisma";

export type PrismaMigrationStatus = {
  migrationsTableExists: boolean;
  appliedMigrations: string[];
  testConnectionTableExists: boolean;
  hint: string | null;
};

export async function getPrismaMigrationStatus(): Promise<PrismaMigrationStatus> {
  let migrationsTableExists = false;
  let appliedMigrations: string[] = [];
  let testConnectionTableExists = false;

  try {
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
      ORDER BY finished_at DESC
    `;
    migrationsTableExists = true;
    appliedMigrations = rows.map((row) => row.migration_name);
  } catch {
    migrationsTableExists = false;
  }

  try {
    const tableRows = await prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'TestConnection'
      ) AS exists
    `;
    testConnectionTableExists = Boolean(tableRows[0]?.exists);
  } catch {
    testConnectionTableExists = false;
  }

  let hint: string | null = null;
  if (!testConnectionTableExists) {
    if (!migrationsTableExists) {
      hint =
        "جدول _prisma_migrations هم وجود ندارد — migrate deploy هنوز روی این دیتابیس اجرا نشده. یک deploy جدید بزنید و در لاگ پارس‌پک عبارت «Prisma migration completed successfully» را ببینید.";
    } else if (appliedMigrations.length === 0) {
      hint =
        "جدول migration خالی است — migrate deploy ناقص مانده. کانتینر را ری‌استارت کنید یا لاگ استارت را بررسی کنید.";
    } else {
      hint =
        "برخی migrationها ثبت شده‌اند اما TestConnection وجود ندارد — ممکن است DATABASE_URL به دیتابیس دیگری اشاره کند.";
    }
  }

  return {
    migrationsTableExists,
    appliedMigrations,
    testConnectionTableExists,
    hint,
  };
}
