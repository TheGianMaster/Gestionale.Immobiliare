import type { Config } from 'tailwindcss'

const config: Config = {
  // Specifica i file che contengono classi Tailwind
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Supporto dark mode via attributo data-theme
  darkMode: ['class', '[data-theme="dark"]'],

  theme: {
    extend: {
      // Colori mappati su CSS variables (definite in globals.css, palette in T-003/T-110)
      colors: {
        // Colori base
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',

        // Colori brand
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          foreground: 'var(--color-primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          foreground: 'var(--color-secondary-foreground)',
        },

        // Colori semantici
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',

        // Sidebar
        sidebar: {
          background: 'var(--color-sidebar-background)',
          foreground: 'var(--color-sidebar-foreground)',
          border: 'var(--color-sidebar-border)',
          active: 'var(--color-sidebar-active)',
        },

        // Muted
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
      },

      // Font configurato via CSS variable
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },

      // Border radius dai token
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },

      // Box shadows dai token
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },

  plugins: [],
}

export default config
