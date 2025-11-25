/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#0f172a',
        secondary: '#22c55e',
        background: '#f8fafc',
        accent: '#06b6d4',
      },
      boxShadow: {
        card: '0 10px 30px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
}
