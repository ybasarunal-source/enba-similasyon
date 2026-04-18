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
          orange: "#E35205",
          "orange-dark": "#C24604",
          dark: "#1A1A1A",
          "dark-light": "#333333",
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
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
