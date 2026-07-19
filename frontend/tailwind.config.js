/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F6F1E4",
        card: "#FCFAF3",
        ink: "#1E2A4A",
        inkLight: "#28365F",
        gold: "#B8863A",
        goldLight: "#C6954A",
        green: "#2F6B4F",
        red: "#9C3B3B",
        border: "#C9BB98",
        borderLight: "#DCD0AF",
        muted: "#8A7A55",
        text: "#241C10",
        textMuted: "#5B4E3A",
      },
    },
  },
  plugins: [],
};
