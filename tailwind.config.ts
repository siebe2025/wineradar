import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: "#fdf2f4",
          100: "#fbe8eb",
          200: "#f5d0d5",
          300: "#ebb0b9",
          400: "#d8808f",
          500: "#c05570",
          600: "#a33a52",
          700: "#7B2C3B",
          800: "#6a2433",
          900: "#5a1f2c",
          950: "#2d0f17",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
