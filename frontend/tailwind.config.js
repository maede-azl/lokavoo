/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        vazir: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#2251FF',
          'blue-dark': '#1638C7',
          orange: '#FF7A1A',
        },
      },
      boxShadow: {
        card: '0 4px 24px -4px rgba(20, 30, 70, 0.08)',
        soft: '0 2px 12px -2px rgba(20, 30, 70, 0.06)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
