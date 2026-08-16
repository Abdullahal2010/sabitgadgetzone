import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0A2E44',
        brand: '#0E8FC4',
        'brand-dark': '#0A6E9C',
        'brand-light': '#EAF6FC',
        teal: '#17C3B2',
        star: '#FFB020',
        muted: '#8A9AA5',
        border: '#E3EDF2',
        bg: '#F3F7FA'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
        bn: ['var(--font-noto-bengali)', 'sans-serif']
      },
      boxShadow: {
        card: '0 6px 18px rgba(10,46,68,.08)',
        'card-lg': '0 16px 36px rgba(10,46,68,.18)'
      },
      borderRadius: { xl2: '10px' }
    }
  },
  plugins: []
};

export default config;
