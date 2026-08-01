import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-body)", "Inter", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#070B19",
          900: "#0A1128",
          800: "#131C38",
          700: "#1C294E",
        },
        cream: {
          50: "#FAF8F3",
          100: "#F4F0E8",
          200: "#E8E2D5",
        },
        amber: {
          400: "#F59E0B",
          500: "#D97706",
        },
      },
    },
  },
  plugins: [],
};
export default config;
