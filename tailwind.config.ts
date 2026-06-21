import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],

  // Dark mode via attributo data-theme sul tag <html>
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      // ——— COLORI (mappati su CSS variables da globals.css) ———
      colors: {
        brand:             'var(--color-brand)',
        'brand-hover':     'var(--color-brand-hover)',
        'brand-light':     'var(--color-brand-light)',
        'brand-dark':      'var(--color-brand-dark)',
        bg:                'var(--color-bg)',
        surface:           'var(--color-surface)',
        'surface-hover':   'var(--color-surface-hover)',
        'surface-elevated':'var(--color-surface-elevated)',
        border:            'var(--color-border)',
        'border-strong':   'var(--color-border-strong)',
        'border-focus':    'var(--color-border-focus)',
        'text-primary':    'var(--color-text-primary)',
        'text-secondary':  'var(--color-text-secondary)',
        'text-muted':      'var(--color-text-muted)',
        'text-on-brand':   'var(--color-text-on-brand)',
        success:           'var(--color-success)',
        'success-light':   'var(--color-success-light)',
        warning:           'var(--color-warning)',
        'warning-light':   'var(--color-warning-light)',
        error:             'var(--color-error)',
        'error-light':     'var(--color-error-light)',
        info:              'var(--color-info)',
        'info-light':      'var(--color-info-light)',
      },

      // ——— FONT ———
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ——— BORDER RADIUS ———
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        DEFAULT: 'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },

      // ——— SHADOWS ———
      boxShadow: {
        sm:    'var(--shadow-sm)',
        md:    'var(--shadow-md)',
        DEFAULT: 'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        inner: 'var(--shadow-inner)',
      },

      // ——— ALTEZZE LAYOUT ———
      height: {
        header: 'var(--header-height)',
      },
      minHeight: {
        header: 'var(--header-height)',
      },

      // ——— LARGHEZZE LAYOUT ———
      width: {
        sidebar: 'var(--sidebar-width)',
      },
      minWidth: {
        sidebar: 'var(--sidebar-width)',
      },
    },
  },

  plugins: [],
}

export default config
