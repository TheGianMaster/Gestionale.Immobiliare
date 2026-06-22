'use client'

/**
 * src/components/anagrafica/SearchBar.tsx
 * Barra di ricerca con debounce 400ms.
 * La ricerca è server-side — chiama il db tramite API, non filtra solo i dati in memoria.
 */

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
}

export function SearchBar({
  placeholder = 'Cerca...',
  onSearch,
  debounceMs = 400,
}: SearchBarProps) {
  const [valore, setValore] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce manuale — evita dipendenza da use-debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onSearch(valore.trim())
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [valore, debounceMs, onSearch])

  function pulisci() {
    setValore('')
    onSearch('')
  }

  return (
    <div className="relative w-full max-w-md">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
        aria-hidden="true"
      />
      <input
        type="search"
        value={valore}
        onChange={(e) => setValore(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          outline: 'none',
        }}
        onFocus={(e) => (e.target.style.borderColor = 'var(--color-border-focus)')}
        onBlur={(e)  => (e.target.style.borderColor = 'var(--color-border)')}
        aria-label={placeholder}
      />
      {valore && (
        <button
          onClick={pulisci}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:bg-surface-hover"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Cancella ricerca"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export default SearchBar
