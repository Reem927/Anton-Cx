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
        syne: ["Lato", "sans-serif"],
        "dm-sans": ["Lato", "sans-serif"],
        "dm-mono": ["Lato", "sans-serif"],
        lato: ["Lato", "sans-serif"],
      },
      colors: {
        navy: "#1B3A6B",
        "blue-accent": "#2E6BE6",
        "blue-light": "#EBF0FC",
        "blue-mid": "#C4D4F8",
        "page-bg": "#F7F8FC",
        "card-bg": "#FFFFFF",
        border: "#E8EBF2",
        "border-mid": "#D0D6E8",
        "text-primary": "#0D1C3A",
        "text-secondary": "#6A7590",
        "text-muted": "#A0AABB",
      },
    },
  },
  plugins: [],
};
export default config;
