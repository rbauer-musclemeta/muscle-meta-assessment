import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        teal:  { DEFAULT: "#009090", dark: "#007070", light: "#00B0B0" },
        coral: { DEFAULT: "#E8734A", bright: "#FF841E" },
        gold:  { DEFAULT: "#D4A843", rich: "#D4AF37" },
        navy:  { DEFAULT: "#1A2B4A", dark: "#0F1A2E" },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans:  ["Outfit", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
