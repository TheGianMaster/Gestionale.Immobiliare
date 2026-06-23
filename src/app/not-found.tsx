import Link from 'next/link'
import { Home, ArrowLeft, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-md">

        {/* Icona */}
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <SearchX className="w-9 h-9" style={{ color: 'var(--color-text-muted)' }} />
        </div>

        {/* Testo */}
        <h1 className="text-5xl font-bold mb-2" style={{ color: 'var(--color-brand)' }}>
          404
        </h1>
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Pagina non trovata
        </h2>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          La pagina che stai cercando non esiste o e stata spostata.
        </p>

        {/* Azioni */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="javascript:history.back()"
            onClick={(e) => { e.preventDefault(); history.back() }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Torna indietro
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-brand)',
              color: 'var(--color-text-on-brand)',
            }}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
