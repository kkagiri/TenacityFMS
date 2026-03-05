/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: "tw-", // Prefix to avoid conflicts with DevExtreme
  darkMode: ["class", ".tw-dark"], // Dark mode via .tw-dark class on <html>
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable base styles reset to avoid conflicts
  },
  important: true, // Make Tailwind styles have higher specificity
};
