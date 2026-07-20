const config = {
  plugins: ["@tailwindcss/postcss"],
  theme: {
    extend: {
      screens: {
        lmd: {
          raw: "(min-width: 768px) and (orientation: landscape) and (min-height: 500px)",
        },
      },
    },
  },
};

export default config;
