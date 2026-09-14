/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f0",
          100: "#ffe0dd",
          400: "#ff6b57",
          500: "#e8402a",
          600: "#c22e1b",
          700: "#9c2415",
        },
      },
    },
  },
  plugins: [],
};
