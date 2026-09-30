/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Naree Foundation Logo Colors
        naree: {
          pink: '#be185d',       // Lotus Center & Heart
          rose: '#e11d48',       // Vibrant Petal Accent
          magenta: '#9d174d',    // Deep "Naree" Text
          coral: '#f97316',      // Sunset Petal Top
          gold: '#f59e0b',       // Golden Petal Glow
          teal: '#0d9488',       // Foundation Lower Petals
          emerald: '#10b981',    // Vibrant Base Leaf
          navy: '#0f172a',       // "Foundation" Text Deep Navy
          slate: '#0a101d',      // Dark background tone
        },
        brand: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        phonepe: {
          DEFAULT: '#5f259f',
          dark: '#4a1b7e',
          light: '#7932c7',
        },
        razorpay: {
          DEFAULT: '#0c2340',
          blue: '#0284c7',
          dark: '#08182b',
        },
        iot: {
          online: '#10b981',
          offline: '#ef4444',
          warning: '#f59e0b',
        }
      },
      keyframes: {
        'lotus-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'shimmer': {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'lotus-float': 'lotus-float 4s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
