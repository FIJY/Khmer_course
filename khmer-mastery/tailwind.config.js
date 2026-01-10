/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Добавим наши фирменные цвета сразу
      colors: {
        brand: "#00E0FF", // Неоновый голубой (Cyberpunk)
        dark: "#121212",  // Глубокий черный фон
        card: "#1E1E1E"   // Цвет карточек
      }
    },
  },
  plugins: [],
}