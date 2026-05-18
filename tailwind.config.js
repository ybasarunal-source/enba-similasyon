/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        enba: {
          orange:    "#E35205",
          "orange-dark": "#C24604",
          "orange-2": "#C24604",
          dark:      "#1A1A1A",
          "dark-light": "#333333",
          // DetailedPlan theme-aware tokens (light/dark via CSS vars)
          panel:     "rgb(var(--enba-panel) / <alpha-value>)",
          "panel-2": "rgb(var(--enba-panel-2) / <alpha-value>)",
          bg:        "rgb(var(--enba-bg) / <alpha-value>)",
          line:      "rgb(var(--enba-line) / <alpha-value>)",
          "line-2":  "rgb(var(--enba-line-2) / <alpha-value>)",
          text:      "rgb(var(--enba-text) / <alpha-value>)",
          muted:     "rgb(var(--enba-muted) / <alpha-value>)",
          dim:       "rgb(var(--enba-dim) / <alpha-value>)",
          // Fixed accent colors
          green:     "#3DBE7C",
          red:       "#E5484D",
          amber:     "#F2A93B",
          blue:      "#5B9DFF",
        },
        surface: "#F7F7F7",
        "on-surface": "#1A1A1A",
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        // Legacy aliases kept for backward compat
        manrope: ['Poppins', 'sans-serif'],
        inter: ['Poppins', 'sans-serif'],
      },
      fontWeight: {
        // Tone down aggressive weights — "black" fonts look heavy with Poppins
        black: '700',
        extrabold: '600',
        bold: '600',
        semibold: '500',
      },
      fontSize: {
        // Scale down the extreme sizes used in modules
        '4xl': ['1.75rem', { lineHeight: '2rem' }],
        '3xl': ['1.375rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.125rem', { lineHeight: '1.5rem' }],
        'xl':  ['1rem',     { lineHeight: '1.5rem' }],
      },
      boxShadow: {
        card: '0 8px 24px rgba(0, 0, 0, 0.04)',
        elevated: '0 12px 40px rgba(0, 0, 0, 0.08)',
        enba: '0 8px 24px rgba(0, 0, 0, 0.2)',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
