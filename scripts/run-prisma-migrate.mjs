import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const prismaCli = path.join(root, "node_modules/prisma/build/index.js");
const migrationsDir = path.join(root, "prisma/migrations");

if (!process.env.DATABASE_URL?.trim()) {
  console.error("[prisma] DATABASE_URL is not set — cannot run migrate deploy");
  process.exit(1);
}

if (!existsSync(prismaCli)) {
  console.error("[prisma] CLI not found:", prismaCli);
  process.exit(1);
}

if (!existsSync(migrationsDir)) {
  console.error("[prisma] migrations folder not found:", migrationsDir);
  process.exit(1);
}

console.log("=== Prisma migrate deploy ===");
try {
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  console.log("=== Prisma migration completed successfully ===");
} catch {
  console.error(
    "=== ERROR: Prisma migrate deploy failed — check DATABASE_URL and database reachability ==="
  );
  process.exit(1);
}
