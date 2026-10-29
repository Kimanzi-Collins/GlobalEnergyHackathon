import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#07080B',
          subtle: '#0F1117',
          surface: '#151821',
          elevated: '#1D212F',
        },
        savannah: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        safari: {
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        crimson: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        parchment: {
          DEFAULT: '#FAF8F4',
          muted: '#E5E0D8',
          dark: '#2A2926',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        editorial: ['Instrument Serif', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'quart-out': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        wave: {
          '0%, 100%': { height: '12%' },
          '50%': { height: '90%' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        wave: 'wave 1.2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
