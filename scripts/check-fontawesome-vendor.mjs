import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendorRoot = path.join(root, "vendor", "fortawesome");

const REQUIRED_DIRS = [
  "fontawesome-svg-core",
  "react-fontawesome",
  "pro-solid-svg-icons",
  "pro-regular-svg-icons",
  "pro-light-svg-icons",
];

const missing = REQUIRED_DIRS.filter((dir) => {
  const pkg = path.join(vendorRoot, dir, "package.json");
  return !fs.existsSync(pkg);
});

if (missing.length === 0) {
  process.exit(0);
}

console.error(
  "Font Awesome Pro vendor folder is incomplete.\n" +
    "ParsPack cannot reach npm.fontawesome.com — packages must live in the repo.\n\n" +
    "Missing:\n" +
    missing.map((d) => `  - vendor/fortawesome/${d}/`).join("\n") +
    "\n\nOn your PC (with internet + Pro license):\n" +
    "  $env:FONTAWESOME_TOKEN = \"YOUR_TOKEN\"\n" +
    "  node scripts/vendor-fontawesome.mjs\n" +
    "  npm install\n" +
    "  git add vendor/fortawesome package.json package-lock.json\n"
);
process.exit(1);
