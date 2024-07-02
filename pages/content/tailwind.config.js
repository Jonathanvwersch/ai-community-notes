const baseConfig = require('@ai-community-notes/tailwindcss-config');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: ['src/**/*.{ts,tsx}'],
};
