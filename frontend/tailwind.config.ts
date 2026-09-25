import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist Variable", "sans-serif"],
        mono: ["Geist Mono Variable", "monospace"],
      },
      colors: {
        border: "#29332e",
        input: "#39463e",
        ring: "#a6ebbc",
        background: "#0d1110",
        foreground: "#edf2ef",
        muted: {
          DEFAULT: "#1c2520",
          foreground: "#9eada4",
        },
        card: {
          DEFAULT: "#121915",
          foreground: "#edf2ef",
        },
        primary: {
          DEFAULT: "#a6ebbc",
          foreground: "#102318",
        },
        destructive: {
          DEFAULT: "#f3a8a5",
          foreground: "#291412",
        },
      },
      borderRadius: {
        lg: "0.875rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [],
};

export default config;
