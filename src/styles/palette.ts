// =============================================
// FONTE DI VERITA PER TUTTI I COLORI
// Modifica qui -> si propaga ovunque tramite CSS variables in globals.css
// Non usare mai colori hardcoded nel codice: usa sempre var(--color-*)
// =============================================

export const palette = {

  // BRAND / PRIMARY
  brand: {
    50:  '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // NEUTRAL / GRAY
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

  // SEMANTIC
  success: { light: '#D1FAE5', DEFAULT: '#10B981', dark: '#065F46' },
  warning: { light: '#FEF3C7', DEFAULT: '#F59E0B', dark: '#92400E' },
  error:   { light: '#FEE2E2', DEFAULT: '#EF4444', dark: '#991B1B' },
  info:    { light: '#DBEAFE', DEFAULT: '#3B82F6', dark: '#1E40AF' },

  // CALENDARIO (8 colori eventi)
  eventi: [
    '#6366F1',
    '#EF4444',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#8B5CF6',
    '#EC4899',
    '#6B7280',
  ],
}
