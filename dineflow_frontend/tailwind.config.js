/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces & ink
        bone:    '#F5F1EA',
        cream:   '#FBF7F0',
        ivory:   '#FFFCF5',
        ink:     '#1A1614',
        'ink-2': '#3A3530',
        umber:   '#6B5F54',
        sand:    '#D6CCBE',
        saffron: '#C77316',
        'saffron-dark': '#9C5810',

        // Status palette — muted, hospitality-feel (mapped to spec colors)
        moss:    { 50: '#F1F5E6', 100: '#E3ECCF', 500: '#5B7C3E', 700: '#3B5523' }, // Available
        honey:   { 50: '#FDF6E4', 100: '#FAEBC4', 500: '#D49C2A', 700: '#9C6F12' }, // Occupied
        slateb:  { 50: '#EEF1F8', 100: '#DDE3F1', 500: '#2E4374', 700: '#1A2849' }, // Ordered
        clay:    { 50: '#FAEDE7', 100: '#F4DCD3', 500: '#A4452C', 700: '#742D1B' }, // Billed
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card':       '0 1px 2px rgba(26, 22, 20, 0.04), 0 4px 12px rgba(26, 22, 20, 0.04)',
        'card-hover': '0 1px 2px rgba(26, 22, 20, 0.06), 0 16px 32px rgba(26, 22, 20, 0.10)',
        'panel':      '-24px 0 80px rgba(26, 22, 20, 0.16)',
        'pop':        '0 8px 24px rgba(26, 22, 20, 0.12)',
      },
      letterSpacing: {
        'tightish': '-0.012em',
        'tighter2': '-0.025em',
      },
      animation: {
        'slide-in':  'slide-in 320ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in':   'fade-in 200ms ease-out',
        'pop-in':    'pop-in 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)', opacity: 0.6 },
          to:   { transform: 'translateX(0)',    opacity: 1 },
        },
        'fade-in': {
          from: { opacity: 0 }, to: { opacity: 1 },
        },
        'pop-in': {
          from: { opacity: 0, transform: 'scale(0.96) translateY(8px)' },
          to:   { opacity: 1, transform: 'scale(1)   translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
