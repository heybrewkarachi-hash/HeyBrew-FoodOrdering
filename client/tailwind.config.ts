import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--color-cream)",
        surface: "var(--color-surface)",
        espresso: "var(--color-espresso)",
        muted: "var(--color-muted)",
        success: "var(--color-success)",
        "success-soft": "var(--color-success-soft)",
        whatsapp: "var(--color-whatsapp)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "var(--radius-card)",
        pill: "9999px",
      },
      boxShadow: {
        soft: "0 8px 30px rgba(60, 30, 24, 0.08)",
        sheet: "0 -8px 40px rgba(60, 30, 24, 0.12)",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      spacing: {
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "sheet-in": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "sheet-in": "sheet-in 0.35s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
