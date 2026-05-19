import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Semantic — consome CSS vars (light/dark trocam sozinhos) */
        surface: {
          app: 'var(--surface-app)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          inverse: 'var(--surface-inverse)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          inverse: 'var(--text-inverse)',
          link: 'var(--text-link)',
        },
        border: {
          DEFAULT: 'var(--border-subtle)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
          focus: 'var(--border-focus)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          active: 'var(--accent-active)',
          soft: 'var(--accent-soft)',
          fg: 'var(--accent-fg)',
        },
        success: {
          soft: 'var(--success-soft)',
          strong: 'var(--success-strong)',
          border: 'var(--success-border)',
        },
        warning: {
          soft: 'var(--warning-soft)',
          strong: 'var(--warning-strong)',
          border: 'var(--warning-border)',
        },
        danger: {
          soft: 'var(--danger-soft)',
          strong: 'var(--danger-strong)',
          border: 'var(--danger-border)',
        },
        info: {
          soft: 'var(--info-soft)',
          strong: 'var(--info-strong)',
          border: 'var(--info-border)',
        },
        neutral: {
          soft: 'var(--neutral-soft)',
          strong: 'var(--neutral-strong)',
          border: 'var(--neutral-border)',
        },

        /* Legacy aliases (mantidos para coexistência durante migração) */
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa',
          500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', 950: '#172554',
        },
        gray: {
          50: '#f8f9fb', 100: '#f1f3f5', 200: '#e5e7eb', 300: '#d1d5db', 400: '#9ca3af',
          500: '#6b7280', 600: '#4b5563', 700: '#374151', 800: '#1f2937', 900: '#111827', 950: '#0a0b0f',
        },
        /* Aliases pra paletas antigas se algum legacy ainda referencia */
        successLegacy: {
          50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
        },
        warningLegacy: {
          50: '#fefce8', 100: '#fef3c7', 500: '#eab308', 600: '#ca8a04', 700: '#a16207',
        },
        error: {
          50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 400: '#f87171',
          500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 800: '#991b1b', 900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs:   ['0.6875rem', { lineHeight: '1rem' }],      // 11
        sm:   ['0.8125rem', { lineHeight: '1.125rem' }],  // 13
        base: ['0.875rem',  { lineHeight: '1.25rem' }],   // 14
        md:   ['1rem',      { lineHeight: '1.5rem' }],    // 16
        lg:   ['1.125rem',  { lineHeight: '1.625rem' }],  // 18
        xl:   ['1.375rem',  { lineHeight: '1.875rem' }],  // 22
        '2xl':['1.75rem',   { lineHeight: '2.25rem' }],   // 28
        '3xl':['2.25rem',   { lineHeight: '2.75rem' }],   // 36
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        xs:     'var(--shadow-xs)',
        sm:     'var(--shadow-sm)',
        DEFAULT:'var(--shadow-sm)',
        md:     'var(--shadow-md)',
        lg:     'var(--shadow-lg)',
        xl:     'var(--shadow-xl)',

        /* Legacy aliases */
        custom: 'var(--shadow-sm)',
        'custom-lg': 'var(--shadow-md)',
        'custom-xl': 'var(--shadow-lg)',
      },
      spacing: {
        '18':  '4.5rem',
        '88':  '22rem',
        '128': '32rem',
      },
      transitionDuration: {
        fast: '120ms',
        base: '160ms',
        slow: '220ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.2, 0, 0, 1)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer:      'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      screens: {
        xs: '475px',
      },
    },
  },
  plugins: [animate],
}

export default config
