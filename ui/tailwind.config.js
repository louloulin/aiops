/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          background: '#ffffff',
          text: '#213547',
          surface: '#f3f4f6',
          border: '#e5e7eb',
          primary: '#4f46e5',
        },
        // Dark mode colors
        dark: {
          background: '#1C1C1C',
          text: '#e5e7eb',
          surface: '#212121',
          border: '#374151',
          primary: '#3ecf8e',
        }
      }
    },
  },
  plugins: [],
} 