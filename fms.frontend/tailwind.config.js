/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: "tw-", // Prefix to avoid conflicts with DevExtreme
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
