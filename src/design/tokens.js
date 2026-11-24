/**
 * Design tokens. Tailwind (tailwind.config.js) reads these values, and the
 * contrast tests verify the colour pairs the interface actually uses.
 */
export const COLORS = {
  navy: "#0B1728",
  gold: "#D4A72C",
  goldHover: "#B98D1E",
  white: "#FFFFFF",
  background: "#F5F7FA",
  body: "#334155",
  teal: "#0F766E",
  muted: "#475569",
  line: "#CBD5E1",
  field: "#64748B",
  danger: "#B91C1C",
  warning: "#92400E",
  success: "#166534",
};

export const FONTS = {
  // System stacks: no external font requests (see docs/design-system.md).
  sans: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
  display: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
};

/**
 * Colour pairs used for text and essential UI. `min` is the WCAG 2.2 AA
 * minimum contrast ratio: 4.5 for body text, 3 for large text and UI parts.
 */
export const CONTRAST_PAIRS = [
  { name: "Body text on white", fg: COLORS.body, bg: COLORS.white, min: 4.5 },
  {
    name: "Body text on background",
    fg: COLORS.body,
    bg: COLORS.background,
    min: 4.5,
  },
  { name: "Muted text on white", fg: COLORS.muted, bg: COLORS.white, min: 4.5 },
  {
    name: "Navy heading on white",
    fg: COLORS.navy,
    bg: COLORS.white,
    min: 4.5,
  },
  { name: "Teal link on white", fg: COLORS.teal, bg: COLORS.white, min: 4.5 },
  { name: "White text on navy", fg: COLORS.white, bg: COLORS.navy, min: 4.5 },
  {
    name: "Gold accent text on navy",
    fg: COLORS.gold,
    bg: COLORS.navy,
    min: 4.5,
  },
  {
    name: "Navy text on gold button",
    fg: COLORS.navy,
    bg: COLORS.gold,
    min: 4.5,
  },
  {
    name: "Navy text on gold hover",
    fg: COLORS.navy,
    bg: COLORS.goldHover,
    min: 4.5,
  },
  {
    name: "Danger text on white",
    fg: COLORS.danger,
    bg: COLORS.white,
    min: 4.5,
  },
  {
    name: "Success text on white",
    fg: COLORS.success,
    bg: COLORS.white,
    min: 4.5,
  },
  {
    name: "Warning text on white",
    fg: COLORS.warning,
    bg: COLORS.white,
    min: 4.5,
  },
  {
    name: "Teal focus ring on white (non-text UI)",
    fg: COLORS.teal,
    bg: COLORS.white,
    min: 3,
  },
  {
    name: "Gold focus ring on navy (non-text UI)",
    fg: COLORS.gold,
    bg: COLORS.navy,
    min: 3,
  },
  {
    name: "Decorative card border on white",
    fg: COLORS.line,
    bg: COLORS.white,
    min: 1.3,
  },
  {
    name: "Form field boundary on white (non-text UI)",
    fg: COLORS.field,
    bg: COLORS.white,
    min: 3,
  },
];
