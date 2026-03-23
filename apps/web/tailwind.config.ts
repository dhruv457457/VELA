import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'SF Mono'", "'Fira Code'", "ui-monospace", "monospace"],
      },
      colors: {
        surface: {
          0: "#000000",
          1: "rgba(255,255,255,0.03)",
          2: "rgba(255,255,255,0.06)",
          3: "rgba(255,255,255,0.09)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.12)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
