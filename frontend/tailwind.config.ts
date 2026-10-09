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
          50: "#FFF6EB",
          100: "#FDECDE",
          200: "#F5D6A8",
          300: "#EBB978",
          400: "#D99443",
          500: "#C77A16",
          600: "#bd740f",  // The requested theme color
          700: "#965B0B",
          800: "#7A480A",
          900: "#4D2D06",  // Dark enough for high-contrast text on white
          950: "#2B1803",
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
        brand: "#bd740f", // Explicit brand variable
        primary: "#bd740f",
        secondary: "#965B0B",
        accent: "#D99443",
        background: "#FFFFFF",
        // Keeping legacy class names but mapping them to new furniture theme to avoid breaking existing pages too hard
        gold: {
          50: "#FFF6EB", 100: "#F5D6A8", 200: "#EBB978", 300: "#C77A16", 400: "#bd740f",
          500: "#bd740f", 600: "#965B0B", 700: "#7A480A", 800: "#4D2D06", 900: "#2B1803",
        },
        brown: "#7A480A",
        cream: "#FFFFFF",
        muted: "#D99443",
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
