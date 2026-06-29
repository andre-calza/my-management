/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#18212f',
        panel: '#f8fafc',
        line: '#d8dee8',
        brand: '#0f766e'
      }
    }
  },
  plugins: []
};
