/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    'src/templates/**/*.html',
    'src/layouts/**/*.html',
    'src/components/**/*.html',
  ],
  theme: {
    extend: {
      screens: {
        sm: { max: '600px' },
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-box-shadow'),
    require('tailwindcss-email-variants'),
    require('tailwindcss-mso'),
  ],
  corePlugins: {
    preflight: false,
    backgroundOpacity: false,
    borderOpacity: false,
    divideOpacity: false,
    placeholderOpacity: false,
    ringOpacity: false,
    textOpacity: false,
  },
}
