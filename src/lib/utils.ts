/**
 * src/lib/utils.ts
 * Helper functions riutilizzabili in tutto il progetto.
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina classi CSS con supporto Tailwind merge.
 * Usare in tutti i componenti al posto di template literals per le classi.
 *
 * Esempio: cn('p-4 bg-red-500', condition && 'font-bold', 'bg-blue-500')
 * → 'p-4 bg-blue-500 font-bold' (bg-blue sovrascrive bg-red grazie a twMerge)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Converte una stringa in slug URL-safe.
 * Esempio: "Clienti B2B" → "clienti-b2b"
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Formatta una data in formato italiano DD/MM/YYYY.
 */
export function formatData(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatta un importo in euro, locale it-IT.
 * Esempio: 1234.5 → "1.234,50 €"
 */
export function formatEuro(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatta bytes in formato leggibile.
 * Esempio: 1234567 → "1.2 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Tronca un testo a un numero massimo di caratteri.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Ritarda l'esecuzione (utile per debounce manuale).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
