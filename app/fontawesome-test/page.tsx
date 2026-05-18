"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faHeart,
  faStar,
  faUser,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faBell,
  faCalendar,
  faEnvelope,
} from "@fortawesome/pro-regular-svg-icons";
import {
  faCamera,
  faGem,
  faRocket,
} from "@fortawesome/pro-light-svg-icons";
import Link from "next/link";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type IconItem = {
  icon: IconDefinition;
  name: string;
};

const SOLID_ICONS: IconItem[] = [
  { icon: faUser, name: "user (solid)" },
  { icon: faHeart, name: "heart (solid)" },
  { icon: faStar, name: "star (solid)" },
  { icon: faCheck, name: "check (solid)" },
];

const REGULAR_ICONS: IconItem[] = [
  { icon: faEnvelope, name: "envelope (regular)" },
  { icon: faBell, name: "bell (regular)" },
  { icon: faCalendar, name: "calendar (regular)" },
];

const LIGHT_ICONS: IconItem[] = [
  { icon: faRocket, name: "rocket (light)" },
  { icon: faGem, name: "gem (light)" },
  { icon: faCamera, name: "camera (light)" },
];

function IconGrid({
  title,
  icons,
  iconClassName,
}: {
  title: string;
  icons: IconItem[];
  iconClassName: string;
}) {
  return (
    <section className="w-full max-w-2xl">
      <h2 className="mb-4 text-lg font-medium text-slate-700 dark:text-slate-200">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {icons.map(({ icon, name }) => (
          <div
            key={name}
            className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-800"
          >
            <FontAwesomeIcon icon={icon} className={`text-3xl ${iconClassName}`} />
            <span className="text-center font-mono text-xs text-slate-600 dark:text-slate-400">
              {name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FontAwesomeTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-8 bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-10 dark:from-slate-900 dark:to-slate-800">
      <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
          تست Font Awesome Pro
        </h1>
        <div className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
          Font Awesome Pro با موفقیت بارگذاری شد — آیکون‌های light نشانه‌ی فعال بودن
          نسخه‌ی Pro هستند
        </div>
      </div>

      <IconGrid title="Solid" icons={SOLID_ICONS} iconClassName="text-slate-800 dark:text-slate-100" />
      <IconGrid
        title="Regular"
        icons={REGULAR_ICONS}
        iconClassName="text-blue-700 dark:text-blue-300"
      />
      <IconGrid
        title="Light (فقط Pro)"
        icons={LIGHT_ICONS}
        iconClassName="text-violet-600 dark:text-violet-300"
      />

      <Link
        href="/"
        className="text-sm text-slate-600 underline hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        بازگشت به صفحهٔ اصلی
      </Link>
    </main>
  );
}
