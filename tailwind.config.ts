import type { Config } from 'tailwindcss';

const rgb = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

/**
 * Pepea design tokens (see DESIGN.md).
 * Raw palette colours are fixed; the chapter tokens (bg, surface, fg, fg2, line, accent)
 * are CSS variables that change per `data-chapter` section, so one component works on light and dark.
 */
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette
        graphite: rgb('graphite'),
        paper: rgb('paper'),
        snow: rgb('snow'),
        phosphor: rgb('phosphor'),
        screen: rgb('screen'),
        // The dashboard (components/dashboard, app/dashboard) was written against the first design draft and
        // uses these names. They are kept, re-pointed onto the Apple-grade palette, so both surfaces match.
        // New code should prefer the chapter tokens below (bg, surface, fg, fg2, line, accent).
        ink: { DEFAULT: rgb('ink'), surface: rgb('ink-surface'), elevated: rgb('ink-elevated') },
        bone: { DEFAULT: rgb('bone'), muted: rgb('bone-muted') },
        acacia: { DEFAULT: rgb('acacia'), light: rgb('acacia-light'), dark: rgb('acacia-dark') },
        murram: { DEFAULT: rgb('murram'), light: rgb('murram-light'), dark: rgb('murram-dark') },
        saffron: { DEFAULT: rgb('saffron'), light: rgb('saffron-light'), dark: rgb('saffron-dark') },
        // Chapter tokens
        bg: rgb('bg'),
        surface: rgb('surface'),
        fg: rgb('fg'),
        fg2: rgb('fg-2'),
        line: rgb('line'),
        accent: rgb('accent'),
        'accent-fg': rgb('accent-fg'),
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
        // Dashboard aliases (font-display, font-editorial, font-fraunces): one typeface across the product.
        display: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        editorial: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        fraunces: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        160: '160ms',
        240: '240ms',
      },
      fontSize: {
        // Fluid scale, display to body is well over 10:1 (see DESIGN.md section 3)
        micro: ['clamp(0.72rem, 0.7rem + 0.1vw, 0.8rem)', { lineHeight: '1.3', letterSpacing: '0.02em' }],
        body: ['clamp(1rem, 0.96rem + 0.2vw, 1.125rem)', { lineHeight: '1.6' }],
        lead: ['clamp(1.25rem, 1.05rem + 0.9vw, 1.75rem)', { lineHeight: '1.35', letterSpacing: '-0.012em' }],
        h3: ['clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem)', { lineHeight: '1.12', letterSpacing: '-0.022em' }],
        h2: ['clamp(2.25rem, 1.4rem + 3.8vw, 5rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        h1: ['clamp(3rem, 1.5rem + 7vw, 8.5rem)', { lineHeight: '0.96', letterSpacing: '-0.045em' }],
        // Dashboard scale: page titles and the monumental numeral on each page.
        dash: ['clamp(2.5rem, 1.5rem + 3.8vw, 4.75rem)', { lineHeight: '0.98', letterSpacing: '-0.04em' }],
        stat: ['clamp(3.75rem, 1.5rem + 8vw, 9rem)', { lineHeight: '0.88', letterSpacing: '-0.055em' }],
        mega: ['clamp(5rem, 2rem + 17vw, 20rem)', { lineHeight: '0.84', letterSpacing: '-0.06em' }],
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'quart-out': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'expo-in-out': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        blink: { '0%, 49%': { opacity: '1' }, '50%, 100%': { opacity: '0' } },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translate3d(0, 8px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        rise: {
          '0%': { transform: 'translate3d(0, 24px, 0)', opacity: '0' },
          '100%': { transform: 'translate3d(0, 0, 0)', opacity: '1' },
        },
        word: {
          '0%': { transform: 'translate3d(0, 110%, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        lift: {
          '0%': { transform: 'translate3d(0, 64px, 0)' },
          '100%': { transform: 'translate3d(0, 0, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        blink: 'blink 1s steps(1) infinite',
        'fade-in': 'fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        rise: 'rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        lift: 'lift 1.1s cubic-bezier(0.16, 1, 0.3, 1) both',
        word: 'word 1s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2.4s cubic-bezier(0.25, 1, 0.5, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
