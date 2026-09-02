/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1B24",
          900: "#0F2733",
          800: "#153444",
          700: "#1C4356",
        },
        signal: {
          teal: "#1C9E9E",
          amber: "#E8A33D",
          coral: "#E1573E",
          mist: "#EAF3F3",
        },
        // Premium palette additions
        brand: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        emerald: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        slate: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        rose: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "'IBM Plex Sans'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,39,51,0.06), 0 4px 12px rgba(15,39,51,0.08)",
        "card-hover": "0 4px 8px rgba(15,39,51,0.10), 0 12px 32px rgba(15,39,51,0.12)",
        glass: "0 8px 32px rgba(31,38,135,0.15), inset 0 1px 0 rgba(255,255,255,0.2)",
        glow: "0 0 20px rgba(28,158,158,0.35)",
        "glow-amber": "0 0 20px rgba(232,163,61,0.35)",
        "glow-coral": "0 0 20px rgba(225,87,62,0.35)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-mesh": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "gradient-brand": "linear-gradient(135deg, #0ea5e9 0%, #1C9E9E 100%)",
        "gradient-dark": "linear-gradient(180deg, #0F2733 0%, #0B1B24 100%)",
      },
      keyframes: {
        "pulse-ring": {
          "0%":   { transform: "scale(0.95)", opacity: "1" },
          "50%":  { transform: "scale(1.05)", opacity: "0.7" },
          "100%": { transform: "scale(0.95)", opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(16px)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-up": {
          from: { transform: "translateY(12px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to:   { transform: "scale(1)",    opacity: "1" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(28,158,158,0.3)" },
          "50%":      { boxShadow: "0 0 24px rgba(28,158,158,0.6)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.6s ease-in-out infinite",
        "slide-in":  "slide-in 0.25s ease-out",
        "slide-up":  "slide-up 0.3s ease-out",
        "fade-in":   "fade-in 0.4s ease-out",
        "scale-in":  "scale-in 0.2s ease-out",
        shimmer:     "shimmer 2s linear infinite",
        float:       "float 6s ease-in-out infinite",
        glow:        "glow 2s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      transitionDuration: {
        250: "250ms",
      },
    },
  },
  plugins: [],
};
