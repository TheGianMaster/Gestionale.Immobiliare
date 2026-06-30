/**
 * Pagina 404 personalizzata per anagrafica non trovata.
 */

import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function AnagraficaNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
      <FileQuestion className="w-12 h-12" style={{ color: 'var(--color-text-muted)' }} />
      <div>
        <h1 className="text-lg font-semibold text-text-primary mb-1">
          Anagrafica non trovata
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Questa anagrafica non esiste o non è attiva.
        </p>
      </div>
      <Link
        href="/"
        className="px-4 py-2 text-sm font-medium rounded-lg"
        style={{
          backgroundColor: 'var(--color-brand)',
          color: 'var(--color-text-on-brand)',
        }}
      >
        Torna alla dashboard
      </Link>
    </div>
  )
}
