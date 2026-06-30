'use client'

/**
 * src/components/layout/Header.tsx
 * Header principale fisso in alto.
 *
 * Elementi:
 * - Hamburger (mobile/tablet): dispatcha evento 'sidebar:toggle' per aprire Sidebar
 * - Logo/Nome app
 * - Breadcrumb (generato da usePathname, desktop only)
 * - NotificationBell
 * - UserMenu
 */

import { Menu, Home, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { UserMenu } from './UserMenu'
import { NotificationBell } from './NotificationBell'
import { AppLogo } from '@/components/ui/AppLogo'
import { APP_CONFIG } from '@/config/app'

interface HeaderUser {
  id?: string | null
  name?: string | null
  email?: string | null
  nome?: string | null
  cognome?: string | null
  ruolo?: string | null
}

interface HeaderProps {
  user: HeaderUser
}

// ——— BREADCRUMB ———
// Mappa segmenti URL → etichette leggibili
const LABELS_SEGMENTO: Record<string, string> = {
  home:       'Dashboard',
  anagrafica: 'Anagrafiche',
  calendario: 'Calendario',
  controllo:  'Pannello Controllo',
  notifiche:  'Notifiche',
  view:       'Vista',
  edit:       'Modifica',
  documenti:  'Documenti',
  new:        'Nuova scheda',
}

function Breadcrumb() {
  const pathname = usePathname()
  if (pathname === '/home') return null

  const segmenti = pathname.split('/').filter(Boolean)

  return (
    <nav
      className="hidden md:flex items-center gap-1 text-sm text-text-muted ml-4"
      aria-label="Breadcrumb"
    >
      <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {segmenti.map((seg, idx) => {
        const isUltimo = idx === segmenti.length - 1
        // ObjectId MongoDB: 24 char hex — abbrevia
        const label = LABELS_SEGMENTO[seg]
          ?? (seg.length === 24 && /^[0-9a-f]+$/i.test(seg)
            ? `#${seg.slice(-6)}`
            : seg.charAt(0).toUpperCase() + seg.slice(1))
        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 opacity-50" aria-hidden="true" />
            <span
              className={
                isUltimo
                  ? 'text-text-primary font-medium'
                  : 'text-text-muted'
              }
            >
              {label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}

// ——— HEADER ———
export function Header({ user }: HeaderProps) {
  function toggleSidebar() {
    window.dispatchEvent(new Event('sidebar:toggle'))
  }

  const nome    = user.nome    ?? user.name?.split(' ')[0] ?? ''
  const cognome = user.cognome ?? user.name?.split(' ')[1] ?? ''
  const email   = user.email ?? ''
  const ruolo   = user.ruolo ?? 'operatore'

  return (
    <header
      className="fixed top-0 right-0 left-0 z-20 flex items-center px-4 gap-3"
      style={{
        height: 'var(--header-height)',
        left: 0,
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Hamburger — solo mobile/tablet */}
      <button
        onClick={toggleSidebar}
        className="btn-icon lg:hidden"
        aria-label="Apri menu di navigazione"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      {/* Logo — visibile su mobile quando sidebar è chiusa */}
      <div className="flex items-center gap-2 lg:hidden">
        <AppLogo size={28} />
        <span className="text-sm font-semibold text-text-primary">{APP_CONFIG.nome}</span>
      </div>

      {/* Breadcrumb — desktop */}
      <Breadcrumb />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Azioni destra */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <UserMenu
          nome={nome}
          cognome={cognome}
          email={email}
          ruolo={ruolo}
        />
      </div>
    </header>
  )
}

export default Header
