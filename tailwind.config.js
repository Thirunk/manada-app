import { COLORS, FONTS } from "./src/design/tokens.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: COLORS.navy,
        gold: { DEFAULT: COLORS.gold, hover: COLORS.goldHover },
        teal: COLORS.teal,
        body: COLORS.body,
        muted: COLORS.muted,
        canvas: COLORS.background,
        field: COLORS.field,
        danger: COLORS.danger,
        success: COLORS.success,
        warning: COLORS.warning,
      },
      fontFamily: {
        sans: FONTS.sans,
        display: FONTS.display,
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 23, 40, 0.06), 0 6px 18px rgba(11, 23, 40, 0.06)",
        raised: "0 12px 32px rgba(11, 23, 40, 0.12)",
      },
    },
  },
  plugins: [],
};
