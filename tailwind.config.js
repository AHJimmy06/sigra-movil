/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: '#155E75',
        ink: '#172033',
        canvas: '#F6F8FB',
      },
    },
  },
  plugins: [],
};
