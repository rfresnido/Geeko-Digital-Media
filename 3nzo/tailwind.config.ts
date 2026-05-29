import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Geeko Digital Media Brand Colors
        geeko: {
          teal: "#2A9D8F",
          navy: "#1D3557",
          orange: "#E76F51",
          lime: "#7CB518",
          sky: "#5DADE2",
        },
        // Semantic mappings
        primary: {
          DEFAULT: "#2A9D8F",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1D3557",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#E76F51",
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#7CB518",
          foreground: "#ffffff",
        },
        info: {
          DEFAULT: "#5DADE2",
          foreground: "#ffffff",
        },
        background: "#f8fafc",
        foreground: "#1D3557",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1D3557",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        border: "#e2e8f0",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
