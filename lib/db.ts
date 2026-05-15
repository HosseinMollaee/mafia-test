import "server-only";
import { Pool } from "pg";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const REQUIRED_ENV_KEYS = [
  "DATABASE_HOST",
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
] as const;

export type DatabaseEnvStatus = {
  ok: boolean;
  missing: string[];
  configured: Record<string, boolean>;
};

export function getDatabaseEnvStatus(): DatabaseEnvStatus {
  const configured = {
    DATABASE_HOST: Boolean(process.env.DATABASE_HOST?.trim()),
    DATABASE_PORT: Boolean(process.env.DATABASE_PORT?.trim() || "5432"),
    DATABASE_NAME: Boolean(process.env.DATABASE_NAME?.trim()),
    DATABASE_USER: Boolean(process.env.DATABASE_USER?.trim()),
    DATABASE_PASSWORD: Boolean(process.env.DATABASE_PASSWORD?.trim()),
  };

  const missing = REQUIRED_ENV_KEYS.filter((key) => !configured[key]);

  return {
    ok: missing.length === 0,
    missing: [...missing],
    configured,
  };
}

function createPool(): Pool {
  const envStatus = getDatabaseEnvStatus();
  if (!envStatus.ok) {
    throw new Error(
      `متغیرهای محیطی تنظیم نشده‌اند: ${envStatus.missing.join("، ")}`
    );
  }

  return new Pool({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? "5432"),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    ssl: false,
  });
}

/** Pool is created on first use so runtime env vars from ParsPack are available. */
export function getPool(): Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = createPool();
  }
  return globalForDb.pool;
}

export function getDbErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  if (typeof err === "string" && err.trim()) {
    return err;
  }
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message: unknown }).message);
    if (msg.trim()) return msg;
  }
  return "خطای ناشناخته در اتصال به دیتابیس";
}
