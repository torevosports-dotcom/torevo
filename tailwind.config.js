/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: '#FFFFFF',
        surface: {
          DEFAULT: '#F8F8FA',
          raised:  '#F1F1F3',
        },
        accent: {
          DEFAULT: '#6366F1',
          hover:   '#4F52D9',
          light:   '#4F46E5',
        },
        gold:    { DEFAULT: '#D97706' },
        live:    { DEFAULT: '#16A34A' },
        danger:  { DEFAULT: '#DC2626' },
        ink: {
          primary:   '#09090B',
          secondary: '#52525B',
          muted:     '#71717A',
          disabled:  '#A1A1AA',
        },
      },
    },
  },
  plugins: [],
}
