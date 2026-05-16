import "server-only";
import { Pool, type PoolConfig } from "pg";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

/** Read env at runtime (avoids Next.js inlining undefined at Docker build time). */
function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

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
    DATABASE_HOST: Boolean(runtimeEnv("DATABASE_HOST")),
    DATABASE_PORT: Boolean(runtimeEnv("DATABASE_PORT") ?? "5432"),
    DATABASE_NAME: Boolean(runtimeEnv("DATABASE_NAME")),
    DATABASE_USER: Boolean(runtimeEnv("DATABASE_USER")),
    DATABASE_PASSWORD: Boolean(runtimeEnv("DATABASE_PASSWORD")),
  };

  const missing = REQUIRED_ENV_KEYS.filter((key) => !configured[key]);

  return {
    ok: missing.length === 0,
    missing: [...missing],
    configured,
  };
}

function getPoolConfig(): PoolConfig {
  const envStatus = getDatabaseEnvStatus();
  if (!envStatus.ok) {
    throw new Error(
      `متغیرهای محیطی تنظیم نشده‌اند: ${envStatus.missing.join("، ")}`
    );
  }

  return {
    host: runtimeEnv("DATABASE_HOST"),
    port: Number(runtimeEnv("DATABASE_PORT") ?? "5432"),
    database: runtimeEnv("DATABASE_NAME"),
    user: runtimeEnv("DATABASE_USER"),
    password: runtimeEnv("DATABASE_PASSWORD"),
    ssl: false,
  };
}

/** Pool is created on first use so runtime env vars from ParsPack are available. */
export function getPool(): Pool {
  if (!globalForDb.pool) {
    globalForDb.pool = new Pool(getPoolConfig());
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
