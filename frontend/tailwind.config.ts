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
        // Legacy names share the storefront's forest-green palette.
        wood: {
          50: "#f7f9f8", 100: "#edf4ef", 200: "#dce5df", 300: "#bdcfc3",
          400: "#78978a", 500: "#527565", 600: "#315b49", 700: "#214f40",
          800: "#193e32", 900: "#123337", 950: "#0c2528",
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
        brand: "#214f40",
        primary: "#214f40",
        secondary: "#315b49",
        accent: "#527565",
        background: "#ffffff",
        gold: {
          50: "#f7f9f8", 100: "#edf4ef", 200: "#dce5df", 300: "#bdcfc3",
          400: "#78978a", 500: "#527565", 600: "#315b49", 700: "#214f40",
          800: "#193e32", 900: "#123337",
        },
        brown: "#123337",
        cream: "#ffffff",
        muted: "#6b7d80",
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
