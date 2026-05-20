/**
 * Download Font Awesome Pro npm packages on a machine with access to npm.fontawesome.com,
 * then copy them into vendor/fortawesome/ for ParsPack (no outbound FA registry at build time).
 *
 * PowerShell:
 *   $env:FONTAWESOME_TOKEN = "your-npm-token"
 *   node scripts/vendor-fontawesome.mjs
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FA_VERSION = "6.7.2";
/** FA 6 + React 18+ — v0.2.x deprecated; use 3.1.1+ (npm deprecation notice) */
const REACT_FA_VERSION = "3.1.1";

/** @type {{ npmName: string; dirName: string; version: string }[]} */
const PACKAGES = [
  {
    npmName: "@fortawesome/fontawesome-svg-core",
    dirName: "fontawesome-svg-core",
    version: FA_VERSION,
  },
  {
    npmName: "@fortawesome/react-fontawesome",
    dirName: "react-fontawesome",
    version: REACT_FA_VERSION,
  },
  {
    npmName: "@fortawesome/pro-solid-svg-icons",
    dirName: "pro-solid-svg-icons",
    version: FA_VERSION,
  },
  {
    npmName: "@fortawesome/pro-regular-svg-icons",
    dirName: "pro-regular-svg-icons",
    version: FA_VERSION,
  },
  {
    npmName: "@fortawesome/pro-light-svg-icons",
    dirName: "pro-light-svg-icons",
    version: FA_VERSION,
  },
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendorRoot = path.join(root, "vendor", "fortawesome");
const tmpDir = path.join(root, ".tmp-fontawesome-vendor");

const token = process.env.FONTAWESOME_TOKEN?.trim();
if (!token) {
  console.error(
    "FONTAWESOME_TOKEN is not set.\n" +
      "Token: https://fontawesome.com/account → Package Manager → npm token\n" +
      'PowerShell: $env:FONTAWESOME_TOKEN = "YOUR_TOKEN"'
  );
  process.exit(1);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

fs.mkdirSync(vendorRoot, { recursive: true });
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });

const npmrc = `@fortawesome:registry=https://npm.fontawesome.com/
//npm.fontawesome.com/:_authToken=${token}
`;
fs.writeFileSync(path.join(tmpDir, ".npmrc"), npmrc, "utf8");

const deps = Object.fromEntries(
  PACKAGES.map((p) => [p.npmName, p.version])
);
fs.writeFileSync(
  path.join(tmpDir, "package.json"),
  JSON.stringify({ name: "fa-vendor-tmp", private: true, dependencies: deps }, null, 2),
  "utf8"
);

console.log(`Installing into temp folder, then copying to ${vendorRoot}\n`);
execSync("npm install --omit=dev --no-audit --no-fund", {
  cwd: tmpDir,
  stdio: "inherit",
});

for (const { npmName, dirName } of PACKAGES) {
  const scope = npmName.startsWith("@") ? npmName.slice(1).split("/")[0] : "";
  const pkgName = npmName.split("/").pop();
  const src = path.join(tmpDir, "node_modules", `@${scope}`, pkgName);
  const dest = path.join(vendorRoot, dirName);

  if (!fs.existsSync(path.join(src, "package.json"))) {
    console.error(`Package not found after install: ${npmName} at ${src}`);
    process.exit(1);
  }

  fs.rmSync(dest, { recursive: true, force: true });
  copyDir(src, dest);

  const version = JSON.parse(
    fs.readFileSync(path.join(dest, "package.json"), "utf8")
  ).version;
  console.log(`✓ vendor/fortawesome/${dirName} (${npmName}@${version})`);
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log("\nDone. Next:");
console.log("  npm install");
console.log("  git add vendor/fortawesome package.json package-lock.json");
console.log("  git commit && git push");
