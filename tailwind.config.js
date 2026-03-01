/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',      // Azul oscuro (como tu sistema actual)
        secondary: '#c9a84c',    // Dorado (como el logo MYA)
      },
    },
  },
  plugins: [],
}