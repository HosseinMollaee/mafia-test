import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Use licensed Persian fonts as the global default.
        // Icon fonts (if any) should set their own font-family and won't be affected.
        sans: [
          "IRANYekanX",
          "IRANSansDN",
          ...defaultTheme.fontFamily.sans,
        ],
        iransansdn: ["IRANSansDN", "IRANYekanX", ...defaultTheme.fontFamily.sans],
        mono: ["IRANYekanX", "IRANSansDN"],
      },
    },
  },
  plugins: [],
};

export default config;
