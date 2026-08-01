import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C4A672',
          light: '#D8C39A',
          dark: '#9B7F4E'
        },
        navy: {
          DEFAULT: '#0B1220',
          light: '#111A2E',
          dark: '#070B14'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif']
      }
    }
  },
  plugins: []
};

export default config;
