/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#FDF8EE",
          100: "#F9EDD0",
          200: "#F0D48A",
          300: "#E6BC55",
          400: "#C9A84C",
          500: "#B8963E",
          600: "#9A7A2E",
          700: "#7A5E20",
          800: "#5A4315",
          900: "#3A2B0C",
        },
        navy: {
          50: "#E8EFF8",
          100: "#C5D4EA",
          200: "#8CACD5",
          300: "#4E7FBB",
          400: "#1E3A5F",
          500: "#152D4E",
          600: "#0F2040",
          700: "#0A1628",
          800: "#060E1A",
          900: "#03080F",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Georgia", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.6s ease-out",
        "pulse-gold": "pulseGold 2s infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201, 168, 76, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(201, 168, 76, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gold-shimmer":
          "linear-gradient(90deg, transparent, rgba(201,168,76,0.1), transparent)",
      },
    },
  },
  plugins: [],
};
