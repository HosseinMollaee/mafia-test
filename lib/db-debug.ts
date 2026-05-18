import "server-only";
import { lookup } from "node:dns/promises";

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export type DatabaseEnvDebug = {
  variables: Record<string, string>;
  dns: {
    hostname: string;
    addresses: string[];
    error: string | null;
  };
  connectionTarget: {
    host: string;
    port: number;
    database: string;
    user: string;
  };
  warnings: string[];
};

export async function getDatabaseEnvDebug(): Promise<DatabaseEnvDebug> {
  const host = runtimeEnv("DATABASE_HOST") ?? "";
  const port = Number(runtimeEnv("DATABASE_PORT") ?? "5432");
  const database = runtimeEnv("DATABASE_NAME") ?? "";
  const user = runtimeEnv("DATABASE_USER") ?? "";

  const variables: Record<string, string> = {
    DATABASE_HOST: host || "(خالی)",
    DATABASE_PORT: String(port),
    DATABASE_NAME: database || "(خالی)",
    DATABASE_USER: user || "(خالی)",
    DATABASE_PASSWORD: runtimeEnv("DATABASE_PASSWORD") ? "****" : "(خالی)",
  };

  let addresses: string[] = [];
  let dnsError: string | null = null;

  if (host) {
    try {
      const results = await lookup(host, { all: true });
      addresses = results.map((entry) =>
        entry.family === 6 ? entry.address : entry.address
      );
    } catch (err) {
      dnsError = err instanceof Error ? err.message : String(err);
    }
  }

  const warnings: string[] = [];

  if (/\.apps\.[^.]+\.abrhapaas\.com$/i.test(host)) {
    warnings.push(
      "DATABASE_HOST به آدرس عمومی apps.* اشاره می‌کند. این دامنه معمولاً برای مرورگر/HTTP است و روی پورت 5432 باز نیست. مقدار را به نام کوتاه سرویس عوض کنید: app-postgresql-mafia-test"
    );
  }

  if (addresses.some((ip) => ip.startsWith("192.168."))) {
    warnings.push(
      `نام host به IP داخلی (${addresses.join(", ")}) resolve می‌شود. اگر ECONNREFUSED می‌گیرید، از نام سرویس داخلی (بدون .apps....) استفاده کنید، نه دامنهٔ عمومی.`
    );
  }

  return {
    variables,
    dns: {
      hostname: host,
      addresses,
      error: dnsError,
    },
    connectionTarget: { host, port, database, user },
    warnings,
  };
}
