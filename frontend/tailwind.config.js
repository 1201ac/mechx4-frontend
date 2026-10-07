/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mist: {
          50: 'var(--mist-50)',
          100: 'var(--mist-100)',
          200: 'var(--mist-200)',
        },
        white: 'var(--white)',
        ink: {
          900: 'var(--ink-900)',
          600: 'var(--ink-600)',
          400: 'var(--ink-400)',
        },
        river: {
          600: 'var(--river-600)',
          700: 'var(--river-700)',
          100: 'var(--river-100)',
        },
        tea: {
          500: 'var(--tea-500)',
          100: 'var(--tea-100)',
        },
        marigold: {
          500: 'var(--marigold-500)',
          100: 'var(--marigold-100)',
        },
        rust: {
          600: 'var(--rust-600)',
          100: 'var(--rust-100)',
        },
        sky: {
          500: 'var(--sky-500)',
        },
      },
      fontFamily: {
        heading: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        devanagari: ['"Noto Sans Devanagari"', 'sans-serif'],
        bengali: ['"Noto Sans Bengali"', 'sans-serif'],
      },
      borderRadius: {
        panel: '10px',
        control: '8px',
      },
      boxShadow: {
        floating: '0 8px 24px rgb(19 33 29 / 0.10)',
      },
    },
  },
  plugins: [],
}
