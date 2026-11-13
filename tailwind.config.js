/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          150: '#e1f8e6',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          dark: '#0c831f', // Zepto / Blinkit iconic emerald green
          darker: '#095e16',
          accent: '#ff3269', // Zepto/Blinkit coral pink/orange accent for tags & discounts
          yellow: '#f8c51f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'hover': '0 8px 24px rgba(12, 131, 31, 0.12)',
        'card': '0 1px 4px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};
