# 🎨 DOC-09 — PALETTE COLORI & DESIGN TOKENS
> **Leggi questo file per:** T-003, T-110, T-111
> **File chiave:** `src/styles/palette.ts`, `src/styles/tokens.ts`, `src/styles/globals.css`
> **REGOLA:** `palette.ts` è la FONTE DI VERITÀ. Nessun colore hardcoded nel codice.

---

## 1. PALETTE COLORI — src/styles/palette.ts

```typescript
// src/styles/palette.ts
// =============================================
// FONTE DI VERITÀ PER TUTTI I COLORI
// Modifica qui, si propaga ovunque tramite CSS variables
// =============================================

export const palette = {

  // ——— BRAND / PRIMARY ———
  // Colore principale dell'applicazione
  brand: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',  // ← PRIMARY (indigo)
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // ——— NEUTRAL / GRAY ———
  // Testi, sfondi, bordi
  neutral: {
    0:   '#FFFFFF',
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },

  // ——— SEMANTIC ———
  success: {
    light: '#D1FAE5',
    DEFAULT: '#10B981',
    dark: '#065F46',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#92400E',
  },
  error: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#991B1B',
  },
  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#1E40AF',
  },

  // ——— CALENDARIO (8 colori eventi) ———
  eventi: [
    '#6366F1',  // indigo
    '#EF4444',  // rosso
    '#F59E0B',  // arancione
    '#10B981',  // verde
    '#3B82F6',  // blu
    '#8B5CF6',  // viola
    '#EC4899',  // rosa
    '#6B7280',  // grigio
  ],

} as const

export type PaletteColor = typeof palette
```

---

## 2. DESIGN TOKENS — src/styles/tokens.ts

```typescript
// src/styles/tokens.ts
export const tokens = {

  // ——— SPACING ———
  // Basato su 4px grid
  spacing: {
    0:   '0px',
    1:   '4px',
    2:   '8px',
    3:   '12px',
    4:   '16px',
    5:   '20px',
    6:   '24px',
    8:   '32px',
    10:  '40px',
    12:  '48px',
    16:  '64px',
    20:  '80px',
    24:  '96px',
  },

  // ——— BORDER RADIUS ———
  radius: {
    none: '0px',
    sm:   '4px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    '2xl':'24px',
    full: '9999px',
  },

  // ——— SHADOWS ———
  shadow: {
    sm:  '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md:  '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg:  '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl:  '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.06)',
  },

  // ——— Z-INDEX ———
  zIndex: {
    base:     0,
    elevated: 10,
    dropdown: 100,
    sticky:   200,
    overlay:  300,
    modal:    400,
    popover:  500,
    toast:    600,
  },

  // ——— BREAKPOINTS ———
  breakpoints: {
    sm:  '640px',
    md:  '768px',
    lg:  '1024px',
    xl:  '1280px',
    '2xl': '1536px',
  },

  // ——— TYPOGRAPHY ———
  fontFamily: {
    sans: "'Inter', 'system-ui', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs:   ['12px', { lineHeight: '16px' }],
    sm:   ['14px', { lineHeight: '20px' }],
    base: ['16px', { lineHeight: '24px' }],
    lg:   ['18px', { lineHeight: '28px' }],
    xl:   ['20px', { lineHeight: '28px' }],
    '2xl':['24px', { lineHeight: '32px' }],
    '3xl':['30px', { lineHeight: '36px' }],
    '4xl':['36px', { lineHeight: '40px' }],
  },

  // ——— SIDEBAR ———
  sidebar: {
    width: '256px',       // desktop
    collapsedWidth: '0px',
  },

  // ——— HEADER ———
  header: {
    height: '64px',
  },
}
```

---

## 3. CSS VARIABLES — src/styles/globals.css

```css
/* src/styles/globals.css */
/* Generato dalla palette — non modificare direttamente i valori,
   modifica palette.ts e aggiorna qui di conseguenza */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ——— IMPORTA FONT ——— */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ——— TEMA CHIARO (default) ——— */
:root,
[data-theme="light"] {
  /* Brand */
  --color-brand: #6366F1;
  --color-brand-hover: #4F46E5;
  --color-brand-light: #EEF2FF;
  --color-brand-dark: #4338CA;

  /* Surface (sfondi) */
  --color-bg: #F9FAFB;            /* sfondo pagina principale */
  --color-surface: #FFFFFF;       /* sfondo card, sidebar */
  --color-surface-hover: #F3F4F6; /* hover su righe tabella */
  --color-surface-elevated: #FFFFFF; /* modali, dropdown */

  /* Testo */
  --color-text-primary: #111827;
  --color-text-secondary: #4B5563;
  --color-text-muted: #9CA3AF;
  --color-text-on-brand: #FFFFFF;

  /* Bordi */
  --color-border: #E5E7EB;
  --color-border-strong: #D1D5DB;
  --color-border-focus: #6366F1;

  /* Semantic */
  --color-success: #10B981;
  --color-success-light: #D1FAE5;
  --color-warning: #F59E0B;
  --color-warning-light: #FEF3C7;
  --color-error: #EF4444;
  --color-error-light: #FEE2E2;
  --color-info: #3B82F6;
  --color-info-light: #DBEAFE;

  /* Sidebar */
  --sidebar-width: 256px;
  --header-height: 64px;
}

/* ——— TEMA SCURO ——— */
[data-theme="dark"] {
  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-surface-hover: #334155;
  --color-surface-elevated: #1E293B;

  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;
  --color-text-on-brand: #FFFFFF;

  --color-border: #334155;
  --color-border-strong: #475569;
  --color-border-focus: #818CF8;

  --color-brand: #818CF8;
  --color-brand-hover: #6366F1;
  --color-brand-light: #312E81;
  --color-brand-dark: #A5B4FC;
}

/* ——— RESET E BASE ——— */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  min-height: 100vh;
}

/* ——— SCROLLBAR CUSTOM ——— */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border-strong); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }

/* ——— FOCUS RING ACCESSIBILE ——— */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

## 4. TAILWIND CONFIG

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--color-brand)',
        'brand-hover': 'var(--color-brand-hover)',
        'brand-light': 'var(--color-brand-light)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      height: {
        header: 'var(--header-height)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 5. COMPONENTI UI BASE — SPECIFICA

### Button.tsx
```typescript
// Varianti: primary | secondary | ghost | danger | outline
// Dimensioni: sm | md | lg
// Stati: default | loading | disabled
// Tutti usano var(--color-*) tramite classi Tailwind

// Esempi:
// <Button variant="primary" size="md">Salva</Button>
// <Button variant="danger" size="sm" loading={true}>Elimina</Button>
// <Button variant="ghost" icon={<PlusIcon />}>Aggiungi</Button>
```

### Input.tsx
```typescript
// Props: label, error, helperText, leftIcon, rightIcon, ...HTMLInputProps
// border: var(--color-border), focus: var(--color-border-focus)
// error state: border-error + messaggio rosso sotto
```

### Modal.tsx
```typescript
// Usa @radix-ui/react-dialog
// Overlay: semi-trasparente scuro
// Animazione: fade in + scale up
// Close: ESC, click overlay, X button
// Sizes: sm (400px) | md (560px) | lg (720px) | xl (920px)
```

### Badge.tsx
```typescript
// Varianti: default | success | warning | error | info
// Con dot colorato opzionale a sinistra
// Dimensioni: sm | md
// Esempio: <Badge variant="success" dot>Attivo</Badge>
```
