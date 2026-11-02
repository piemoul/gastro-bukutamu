import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f5fb",
          100: "#dbe6f3",
          200: "#b6cce8",
          300: "#84a8d4",
          400: "#4f82bc",
          500: "#2f64a4",
          600: "#234e88",
          700: "#1d406f",
          800: "#1a365d",
          900: "#152b4a",
          950: "#0e1c33",
        },
        accent: {
          DEFAULT: "#c8102e",
          dark: "#9b0a22",
          light: "#e63b56",
        },
        ink: {
          50: "#f5f7fa",
          100: "#e7eaee",
          200: "#dcdfe4",
          300: "#aeb6c2",
          500: "#5b6473",
          700: "#2a313d",
          900: "#0e1116",
        },
      },
    },
  },
  plugins: [],
};
export default config;
