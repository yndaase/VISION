/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./scholars.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        navy: { DEFAULT: '#1a1a2e', light: '#24243e', accent: '#16213e' },
        gold: { DEFAULT: '#fbbf24', light: '#fcd34d', dark: '#f59e0b' },
        vibrantBlue: '#6366f1',
      },
    },
  },
  plugins: [],
}
