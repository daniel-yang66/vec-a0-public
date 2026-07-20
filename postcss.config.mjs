const config = {
  plugins: ["@tailwindcss/postcss"],
  theme: {
    extend: {
      screens: {
        lmd: {
          raw: "(min-width: 768px) and (orientation: landscape) and (min-height: 500px)",
        },
        phl: {
          raw: "(max-height: 900px) and (orientation: landscape)",
        },
      },
    },
  },
};

export default config;
