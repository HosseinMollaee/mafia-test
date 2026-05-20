import fs from "node:fs";
import path from "node:path";

const FA_REGISTRY = "https://npm.fontawesome.com/";
const NPM_REGISTRY = "https://registry.npmjs.org/";

const VENDOR_PACKAGES = [
  "fontawesome-svg-core",
  "react-fontawesome",
  "pro-solid-svg-icons",
  "pro-regular-svg-icons",
  "pro-light-svg-icons",
  "sharp-duotone-solid-svg-icons",
];

export type RegistryProbe = {
  url: string;
  reachable: boolean;
  status: number | null;
  statusText: string | null;
  error: string | null;
  elapsedMs: number;
};

export type FontAwesomeReachReport = {
  checkedAt: string;
  nodeEnv: string | null;
  fontAwesomeRegistry: RegistryProbe;
  npmPublicRegistry: RegistryProbe;
  vendor: {
    root: string;
    complete: boolean;
    missing: string[];
  };
  fontAwesomeTokenConfigured: boolean;
  interpretation: string;
};

async function probeRegistry(url: string): Promise<RegistryProbe> {
  const start = Date.now();
  try {
    const r = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(15_000),
    });
    return {
      url,
      reachable: true,
      status: r.status,
      statusText: r.statusText || null,
      error: null,
      elapsedMs: Date.now() - start,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      url,
      reachable: false,
      status: null,
      statusText: null,
      error: msg,
      elapsedMs: Date.now() - start,
    };
  }
}

function getVendorStatus(rootDir: string) {
  const vendorRoot = path.join(rootDir, "vendor", "fortawesome");
  const missing = VENDOR_PACKAGES.filter(
    (dir) => !fs.existsSync(path.join(vendorRoot, dir, "package.json"))
  );
  return {
    root: vendorRoot,
    complete: missing.length === 0,
    missing,
  };
}

function buildInterpretation(
  fa: RegistryProbe,
  npm: RegistryProbe,
  vendorComplete: boolean
): string {
  if (fa.reachable && !npm.reachable) {
    return "فقط npm.fontawesome.com از این سرور در دسترس است؛ registry.npmjs.org احتمالاً بسته است.";
  }
  if (fa.reachable && npm.reachable) {
    return "هر دو registry از سرور ParsPack در دسترس‌اند.";
  }
  if (!fa.reachable && vendorComplete) {
    return "npm.fontawesome.com در دسترس نیست؛ با vendor/ داخل repo مشکلی برای build/runtime ندارید.";
  }
  if (!fa.reachable && !vendorComplete) {
    return "npm.fontawesome.com در دسترس نیست و vendor ناقص است — نصب از این سرور ممکن نیست.";
  }
  return "npm.fontawesome.com در دسترس نیست؛ وضعیت npm عمومی را در جدول زیر ببینید.";
}

export async function getFontAwesomeReachReport(
  rootDir = process.cwd()
): Promise<FontAwesomeReachReport> {
  const [fontAwesomeRegistry, npmPublicRegistry] = await Promise.all([
    probeRegistry(FA_REGISTRY),
    probeRegistry(NPM_REGISTRY),
  ]);

  const vendor = getVendorStatus(rootDir);

  return {
    checkedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? null,
    fontAwesomeRegistry,
    npmPublicRegistry,
    vendor,
    fontAwesomeTokenConfigured: Boolean(process.env.FONTAWESOME_TOKEN?.trim()),
    interpretation: buildInterpretation(
      fontAwesomeRegistry,
      npmPublicRegistry,
      vendor.complete
    ),
  };
}
