/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563EB', dark: '#1E40AF', light: '#DBEAFE' },
        secondary: { DEFAULT: '#10B981', dark: '#059669', light: '#D1FAE5' },
        accent: { DEFAULT: '#F59E0B', dark: '#D97706', light: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', dark: '#DC2626', light: '#FEE2E2' },
        sidebar: '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
