/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'nb-blue':   '#2a4a7f',
        'nb-navy':   '#1e3259',
        'nb-red':    '#c0392b',
        'nb-cream':  '#f5f0e8',
        'nb-line':   '#b8cfe0',
        'nb-margin': '#e07070',
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}

