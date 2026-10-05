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
        wood: {
          50: "#FAF6F0",   // Warm Cream
          100: "#F2E8D9",  // Light Birch
          200: "#E3CDB0",  // Light Oak
          300: "#D1AC7F",  // Warm Oak / Caramel
          400: "#C08C50",  // Rich Teak
          500: "#A66D35",  // Solid Brown Wood
          600: "#865123",  // Chestnut
          700: "#6A3C17",  // Walnut
          800: "#552E10",  // Dark Walnut
          900: "#44220A",  // Deep Mahogany (Clearly brown, not black)
        },
        charcoal: {
          50: "#F2F2F2",
          100: "#E6E6E6",
          200: "#CCCCCC",
          300: "#B3B3B3",
          400: "#999999",
          500: "#808080",
          600: "#666666",
          700: "#4D4D4D",
          800: "#333333",
          900: "#1A1A1A",
          950: "#0D0D0D",
        },
        primary: "#44220A", // Deep wood
        secondary: "#A66D35", // Warm wood
        accent: "#D1AC7F", // Light wood accent
        background: "#FAF6F0", // Warm Cream
        // Keeping legacy class names but mapping them to new furniture theme to avoid breaking existing pages too hard
        gold: {
          50: "#FAF6F0", 100: "#F2E8D9", 200: "#D1AC7F", 300: "#C08C50", 400: "#A66D35",
          500: "#A66D35", 600: "#865123", 700: "#6A3C17", 800: "#552E10", 900: "#44220A",
        },
        brown: "#552E10",
        cream: "#FAF6F0",
        muted: "#C08C50",
      },
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"],
        outfit: ["var(--font-outfit)", "sans-serif"],
        // Legacy aliases
        cinzel: ["var(--font-outfit)", "sans-serif"],
        cormorant: ["var(--font-playfair)", "serif"],
        garamond: ["var(--font-inter)", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease both",
        "fade-in": "fadeIn 0.4s ease both",
        "slide-in": "slideIn 0.3s ease both",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideIn: { from: { transform: "translateX(-100%)" }, to: { transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
export default config;
