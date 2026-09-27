import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F7F3EC",
          soft: "#FFFBF5",
          deep: "#EDE6DA",
        },
        espresso: {
          DEFAULT: "#3C2415",
          soft: "#5C3D2E",
          muted: "#7A5A45",
        },
        caramel: {
          DEFAULT: "#A67C52",
          soft: "#C4A484",
        },
        foam: "#F3EDE3",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(60, 36, 21, 0.06), 0 8px 24px rgba(60, 36, 21, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
