export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.PRISMA_MIGRATE_ON_STARTUP === "false") return;
  if (process.env.NODE_ENV !== "production") return;

  const globalKey = "__prismaMigrateDeployDone";
  const g = globalThis as typeof globalThis & Record<string, boolean | undefined>;
  if (g[globalKey]) return;
  g[globalKey] = true;

  const { existsSync } = await import("node:fs");
  const path = await import("node:path");
  const { spawnSync } = await import("node:child_process");

  const script = path.join(process.cwd(), "scripts/run-prisma-migrate.mjs");
  if (!existsSync(script)) {
    console.warn("[prisma] migrate script missing — skipping (Docker entrypoint may run it)");
    return;
  }

  console.log("[prisma] Running migrate deploy via instrumentation (startup fallback)");
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error("Prisma migrate deploy failed during Next.js startup");
  }
}
