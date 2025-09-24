/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../ui-lib/src/**/*.{js,ts,jsx,tsx}",
    "../admin-app/src/**/*.{js,ts,jsx,tsx}",
    "../project-app/src/**/*.{js,ts,jsx,tsx}",
    "../designer-app/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
