/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "var-white": {
          DEFAULT: "hsl(var(--var-white))",
        },
        "var-black": {
          DEFAULT: "hsl(var(--var-black))",
        },
        "var-grey-100": {
          DEFAULT: "hsl(var(--var-grey-100))",
        },
        "var-grey-200": {
          DEFAULT: "hsl(var(--var-grey-200))",
        },
        "var-grey-300": {
          DEFAULT: "hsl(var(--var-grey-300))",
        },
        "var-grey-400": {
          DEFAULT: "hsl(var(--var-grey-400))",
        },
        "var-grey-500": {
          DEFAULT: "hsl(var(--var-grey-500))",
        },
        "var-grey-600": {
          DEFAULT: "hsl(var(--var-grey-600))",
        },
        "var-grey-700": {
          DEFAULT: "hsl(var(--var-grey-700))",
        },
        "var-grey-800": {
          DEFAULT: "hsl(var(--var-grey-800))",
        },
        "var-grey-900": {
          DEFAULT: "hsl(var(--var-grey-900))",
        },
      },
    },
  },
  plugins: [],
}