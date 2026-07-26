/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#1A1A1A',
        warmwhite: '#F5F0EB',
        royalGold: '#D4AF37',
        deepSaffron: '#D4881C',
        terracotta: '#C97D5B',
        oliveGreen: '#6B7F5E',
        antiqueBronze: '#8B6914',
        smokyGray: '#4A4A4A',
        darkWalnut: '#3E2723',
        softBeige: '#E6D5C3',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        luxury: '16px',
        'luxury-lg': '20px',
      },
      boxShadow: {
        luxury: '0 4px 20px rgba(212, 175, 55, 0.15)',
        'luxury-lg': '0 8px 40px rgba(212, 175, 55, 0.2)',
      },
    },
  },
  plugins: [],
};
