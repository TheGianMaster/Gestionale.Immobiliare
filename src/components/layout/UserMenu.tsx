'use client'

/**
 * src/components/layout/UserMenu.tsx
 * Dropdown menu utente nell'header.
 * Mostra: avatar (iniziali), nome, email, ruolo, link profilo/impostazioni (WIP), logout.
 */

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { LogOut, ChevronDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserMenuProps {
  nome: string
  cognome: string
  email: string
  ruolo: string
}

const LABEL_RUOLO: Record<string, string> = {
  admin:     'Admin',
  operatore: 'Operatore',
}

export function UserMenu({ nome, cognome, email, ruolo }: UserMenuProps) {
  const [aperto, setAperto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Chiudi su click fuori
  useEffect(() => {
    function onClickFuori(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAperto(false)
      }
    }
    if (aperto) document.addEventListener('mousedown', onClickFuori)
    return () => document.removeEventListener('mousedown', onClickFuori)
  }, [aperto])

  // Chiudi su Escape
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setAperto(false)
    }
    if (aperto) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [aperto])

  const iniziali = `${nome.charAt(0)}${cognome.charAt(0)}`.toUpperCase()
  const nomeCompleto = `${nome} ${cognome}`

  return (
    <div ref={ref} className="relative">
      {/* ——— TRIGGER ——— */}
      <button
        onClick={() => setAperto((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors',
          'hover:bg-surface-hover text-text-primary',
          aperto && 'bg-surface-hover'
        )}
        aria-expanded={aperto}
        aria-haspopup="menu"
        aria-label={`Menu utente — ${nomeCompleto}`}
      >
        {/* Avatar con iniziali */}
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{
            backgroundColor: 'var(--color-brand)',
            color: 'var(--color-text-on-brand)',
          }}
        >
          {iniziali}
        </span>
        {/* Nome — nascosto su schermi molto piccoli */}
        <span className="hidden sm:block font-medium max-w-[120px] truncate">
          {nome}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-text-muted transition-transform duration-200',
            aperto && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      {/* ——— DROPDOWN ——— */}
      {aperto && (
        <div
          className="absolute right-0 top-full mt-1 w-56 rounded-lg shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-lg)',
          }}
          role="menu"
          aria-label="Menu utente"
        >
          {/* Intestazione utente */}
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  backgroundColor: 'var(--color-brand)',
                  color: 'var(--color-text-on-brand)',
                }}
              >
                {iniziali}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {nomeCompleto}
                </p>
                <p className="text-xs text-text-muted truncate">{email}</p>
                <span
                  className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{
                    backgroundColor: 'var(--color-brand-light)',
                    color: 'var(--color-brand)',
                  }}
                >
                  {LABEL_RUOLO[ruolo] ?? ruolo}
                </span>
              </div>
            </div>
          </div>

          {/* Voci menu */}
          <div className="py-1">
            {/* Profilo — WIP */}
            <button
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors text-left"
              role="menuitem"
              disabled
              title="Coming soon"
            >
              <User className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Profilo</span>
              <span className="ml-auto text-[10px] text-text-muted">WIP</span>
            </button>
          </div>

          {/* Separatore */}
          <div
            className="border-t"
            style={{ borderColor: 'var(--color-border)' }}
          />

          {/* Logout */}
          <div className="py-1">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left"
              style={{ color: 'var(--color-error)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--color-error-light)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
              role="menuitem"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Esci</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu
