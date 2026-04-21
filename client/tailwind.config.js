export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        preview: "0 28px 55px -28px rgba(15, 23, 42, 0.45)",
      },
      colors: {
        canvas: {
          50: "#f8fafc",
          100: "#f1f5f9",
          900: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};
