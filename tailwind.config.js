/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: '#0F766E',
        ink: '#0F172A',
        canvas: '#F2F2F7',
        obsidian: '#0B1120',
      },
    },
  },
  plugins: [],
};
