'use client'

/**
 * src/app/(dashboard)/home/page.tsx
 * Home della dashboard — mostra accesso rapido alle anagrafiche.
 * Route: /home
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, LayoutDashboard } from 'lucide-react'

interface AnagraficaNav {
  slug: string
  nome: string
  colore: string
  icona: string
}

export default function DashboardPage() {
  const [anagrafiche, setAnagrafiche] = useState<AnagraficaNav[]>([])

  useEffect(() => {
    fetch('/api/anagrafiche')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.anagrafiche)) setAnagrafiche(data.anagrafiche)
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <LayoutDashboard
          className="w-6 h-6 shrink-0"
          style={{ color: 'var(--color-brand)' }}
        />
        <h1 className="text-2xl font-semibold text-text-primary">
          Dashboard
        </h1>
      </div>

      {anagrafiche.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            Anagrafiche
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {anagrafiche.map((a) => (
              <Link
                key={a.slug}
                href={`/anagrafica/${a.slug}`}
                className="group flex items-center gap-4 p-4 rounded-xl transition-all hover:shadow-md"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ backgroundColor: a.colore + '20', color: a.colore }}
                >
                  {(a.icona || a.nome).charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold flex-1 truncate transition-colors text-text-primary group-hover:text-brand">
                  {a.nome}
                </p>
                <ArrowRight className="w-4 h-4 shrink-0 text-text-muted group-hover:text-brand transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {anagrafiche.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <LayoutDashboard
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <p className="text-sm font-medium text-text-secondary">
            Nessuna anagrafica configurata
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Le anagrafiche appariranno qui una volta configurate dal Pannello Controllo.
          </p>
        </div>
      )}
    </div>
  )
}
