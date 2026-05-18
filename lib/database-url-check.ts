import "server-only";

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export type ParsedPostgresUrl = {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
};

export type DatabaseUrlValidation = {
  envUrlSet: boolean;
  envUrlMasked: string | null;
  builtUrlMasked: string;
  /** null = DATABASE_URL not set in env */
  consistent: boolean | null;
  status: "match" | "mismatch" | "not_set" | "incomplete_parts" | "invalid_env_url";
  message: string;
  details: string[];
};

export function maskDatabaseUrl(url: string): string {
  try {
    const normalized = url.trim().replace(/^postgres:\/\//i, "postgresql://");
    const parsed = new URL(normalized);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return url.replace(/:([^:@/]+)@/, ":****@");
  }
}

export function buildDatabaseUrlFromParts(
  host: string,
  port: number,
  database: string,
  user: string,
  password: string
): string {
  const userEnc = encodeURIComponent(user);
  const passEnc = encodeURIComponent(password);
  const dbEnc = encodeURIComponent(database);
  return `postgresql://${userEnc}:${passEnc}@${host}:${port}/${dbEnc}`;
}

export function parsePostgresUrl(url: string): ParsedPostgresUrl | null {
  try {
    const normalized = url.trim().replace(/^postgres:\/\//i, "postgresql://");
    const parsed = new URL(normalized);

    if (parsed.protocol !== "postgresql:") {
      return null;
    }

    return {
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
    };
  } catch {
    return null;
  }
}

function fieldMismatch(
  label: string,
  fromUrl: string,
  fromParts: string
): string | null {
  if (fromUrl === fromParts) return null;
  return `${label}: در DATABASE_URL «${fromUrl}» و در پارامتر جدا «${fromParts}»`;
}

export function validateDatabaseUrl(): DatabaseUrlValidation {
  const host = runtimeEnv("DATABASE_HOST");
  const port = Number(runtimeEnv("DATABASE_PORT") ?? "5432");
  const database = runtimeEnv("DATABASE_NAME");
  const user = runtimeEnv("DATABASE_USER");
  const password = runtimeEnv("DATABASE_PASSWORD");
  const envUrl = runtimeEnv("DATABASE_URL");

  const partsComplete = Boolean(host && database && user && password);

  if (!partsComplete) {
    return {
      envUrlSet: Boolean(envUrl),
      envUrlMasked: envUrl ? maskDatabaseUrl(envUrl) : null,
      builtUrlMasked: "(پارامترها کامل نیست)",
      consistent: null,
      status: "incomplete_parts",
      message: "برای ساخت URL، HOST، NAME، USER و PASSWORD لازم است.",
      details: [],
    };
  }

  const builtUrl = buildDatabaseUrlFromParts(
    host!,
    port,
    database!,
    user!,
    password!
  );
  const builtUrlMasked = maskDatabaseUrl(builtUrl);

  if (!envUrl) {
    return {
      envUrlSet: false,
      envUrlMasked: null,
      builtUrlMasked,
      consistent: null,
      status: "not_set",
      message:
        "DATABASE_URL در env تنظیم نشده؛ اتصال فعلی از پارامترهای جداگانه است (درست است).",
      details: [
        "URL پیشنهادی بر اساس پارامترهای فعلی (فقط برای مقایسهٔ دستی):",
        builtUrlMasked,
      ],
    };
  }

  const parsed = parsePostgresUrl(envUrl);
  if (!parsed) {
    return {
      envUrlSet: true,
      envUrlMasked: maskDatabaseUrl(envUrl),
      builtUrlMasked,
      consistent: false,
      status: "invalid_env_url",
      message: "فرمت DATABASE_URL نامعتبر است.",
      details: [],
    };
  }

  const details: string[] = [];
  const mismatches = [
    fieldMismatch("host", parsed.host, host!),
    fieldMismatch("port", parsed.port, String(port)),
    fieldMismatch("database", parsed.database, database!),
    fieldMismatch("user", parsed.user, user!),
  ].filter((item): item is string => item !== null);

  const passwordMatch = parsed.password === password;
  if (!passwordMatch) {
    details.push("password: مقدار DATABASE_URL با DATABASE_PASSWORD یکسان نیست");
  }

  details.push(...mismatches);

  const consistent = mismatches.length === 0 && passwordMatch;

  if (consistent) {
    return {
      envUrlSet: true,
      envUrlMasked: maskDatabaseUrl(envUrl),
      builtUrlMasked,
      consistent: true,
      status: "match",
      message: "DATABASE_URL با پارامترهای جداگانه هم‌خوان است.",
      details: [],
    };
  }

  return {
    envUrlSet: true,
    envUrlMasked: maskDatabaseUrl(envUrl),
    builtUrlMasked,
    consistent: false,
    status: "mismatch",
    message: "DATABASE_URL با پارامترهای HOST/PORT/NAME/USER/PASSWORD هم‌خوان نیست.",
    details,
  };
}
