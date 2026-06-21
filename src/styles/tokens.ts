// =============================================
// DESIGN TOKENS — spacing, radius, shadows, z-index, breakpoints, typography
// Usati come riferimento per componenti e tailwind.config.ts
// =============================================

export const tokens = {

  // ——— SPACING ———
  // Griglia base 4px
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
    sm:    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md:    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg:    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl:    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
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
    sm:   '640px',
    md:   '768px',
    lg:   '1024px',
    xl:   '1280px',
    '2xl':'1536px',
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

  // ——— LAYOUT ———
  sidebar: {
    width:          '256px',
    collapsedWidth: '0px',
  },
  header: {
    height: '64px',
  },

} as const
