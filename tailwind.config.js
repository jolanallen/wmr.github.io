/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'obsidian-bg': '#1e1e1e',
        'obsidian-node': '#161b22',
        'accent-green': '#00ff9d',
      }
    },
  },
  plugins: [],
}
