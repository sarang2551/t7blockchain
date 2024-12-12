/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Include all files in src with these extensions
  ],
  theme: {
    extend: {
      colors: {
        lightBlue: "#B1F0F7",
        mediumBlue: "#81BFDA",
        lightYellow: "#F5F0CD",
        mediumYellow: "#FADA7A",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // You can replace 'Inter' with another font if needed
      },
    },
  },
  plugins: [], // Add plugins here if needed in the future
};
