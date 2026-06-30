'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, Calendar, Settings, X, ChevronRight, ChevronDown, Loader2,
  PanelLeft, PanelLeftClose, PanelLeftOpen, Sun, Moon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppLogo } from '@/components/ui/AppLogo'
import { APP_CONFIG } from '@/config/app'
import type { UserRole } from '@/models/User'
import type { ResolvedNode } from '@/app/api/controllo/layout/route'

type SidebarMode = 'open' | 'icons' | 'hover'
type Theme = 'light' | 'dark'

interface SidebarProps { ruolo: UserRole }

const W_FULL = '256px'
const W_ICON = '60px'

// ── Icona anagrafica (lettera colorata) ───────────────────────

function IconaAnagrafica({ nome, colore }: { nome: string; colore: string }) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0"
      style={{ backgroundColor: colore + '20', color: colore }}
    >
      {(nome ?? '?').charAt(0).toUpperCase()}
    </span>
  )
}

// ── Voce nav generica (builtin) ───────────────────────────────

function VoceNav({ href, label, icona: Icona, collapsed, onClick }: {
  href: string; label: string; icona?: React.ElementType; collapsed: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/home' && pathname.startsWith(href))
  return (
    <Link
      href={href} onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors nav-item',
        collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2',
        active ? 'text-brand font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
      )}
      style={active ? { backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' } : undefined}
      aria-current={active ? 'page' : undefined}
    >
      {Icona && <Icona className="w-4 h-4 shrink-0" />}
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
    </Link>
  )
}

// ── Voce anagrafica ───────────────────────────────────────────

function VoceAnagrafica({ node, collapsed, onClick }: {
  node: ResolvedNode; collapsed: boolean; onClick?: () => void
}) {
  const pathname = usePathname()
  const href = node.href ?? `/anagrafica/${node.id}`
  const active = pathname.startsWith(href)
  return (
    <Link
      href={href} onClick={onClick}
      title={collapsed ? node.label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors nav-item',
        collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2',
        active ? 'font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
      )}
      style={active ? { backgroundColor: (node.colore ?? '#6366F1') + '15', color: node.colore ?? 'var(--color-brand)' } : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <IconaAnagrafica nome={node.icon || node.label} colore={node.colore ?? '#6366F1'} />
      {!collapsed && <span className="truncate">{node.label}</span>}
      {!collapsed && active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
    </Link>
  )
}

// ── Sezione collassabile ──────────────────────────────────────

function Sezione({ node, collapsed, isOpen, onToggle, onClick }: {
  node: ResolvedNode; collapsed: boolean
  isOpen: boolean; onToggle: () => void; onClick?: () => void
}) {
  const visibleChildren = (node.children ?? []).filter(c => c.visible)

  if (collapsed) {
    // In icon-only mode: mostra solo i figli come icone piatte
    return (
      <>
        <div className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />
        {visibleChildren.map(child => (
          <VoceAnagrafica key={child.id} node={child} collapsed={true} onClick={onClick} />
        ))}
      </>
    )
  }

  return (
    <div>
      {/* Intestazione sezione */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-lg transition-colors hover:bg-surface-hover mt-3 mb-0.5"
      >
        {node.icon && <span className="text-sm leading-none">{node.icon}</span>}
        <span
          className="text-[11px] font-semibold uppercase tracking-wider flex-1 truncate"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {node.label}
        </span>
        <ChevronDown
          className={cn('w-3 h-3 transition-transform shrink-0', !isOpen && '-rotate-90')}
          style={{ color: 'var(--color-text-muted)' }}
        />
      </button>

      {/* Figli */}
      {isOpen && visibleChildren.map(child => (
        <VoceAnagrafica key={child.id} node={child} collapsed={false} onClick={onClick} />
      ))}
    </div>
  )
}

// ── Impostazioni popover ──────────────────────────────────────

function ImpostazioniPopover({ mode, onModeChange, theme, onThemeChange, onClose }: {
  mode: SidebarMode; onModeChange: (m: SidebarMode) => void
  theme: Theme; onThemeChange: (t: Theme) => void; onClose: () => void
}) {
  const modalita: { value: SidebarMode; label: string; Icon: React.ElementType }[] = [
    { value: 'open',  label: 'Aperta',     Icon: PanelLeft },
    { value: 'icons', label: 'Solo icone', Icon: PanelLeftClose },
    { value: 'hover', label: 'A comparsa', Icon: PanelLeftOpen },
  ]
  const activeStyle = { backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand)' }
  return (
    <div className="rounded-xl p-3" style={{
      backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-lg)', width: 240,
    }}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
        Modalità sidebar
      </p>
      <div className="space-y-0.5 mb-3">
        {modalita.map(({ value, label, Icon }) => (
          <button key={value} onClick={() => { onModeChange(value); onClose() }}
            className={cn('w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left',
              mode === value ? 'font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover')}
            style={mode === value ? activeStyle : undefined}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
            {mode === value && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-brand)' }} />}
          </button>
        ))}
      </div>
      <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--color-text-muted)' }}>
          Tema
        </p>
        <div className="flex gap-1">
          {([['light', 'Chiaro', Sun], ['dark', 'Scuro', Moon]] as const).map(([val, lbl, Icon]) => (
            <button key={val} onClick={() => { onThemeChange(val); onClose() }}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                theme === val ? 'font-semibold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover')}
              style={theme === val ? activeStyle : undefined}>
              <Icon className="w-3.5 h-3.5" />
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── SidebarContent ────────────────────────────────────────────

function SidebarContent({ ruolo, layoutNodes, loading, collapsed, mode, onModeChange, theme, onThemeChange, onClose }: {
  ruolo: UserRole; layoutNodes: ResolvedNode[]; loading: boolean; collapsed: boolean
  mode: SidebarMode; onModeChange: (m: SidebarMode) => void
  theme: Theme; onThemeChange: (t: Theme) => void; onClose?: () => void
}) {
  const [showSettings, setShowSettings] = useState(false)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const settingsRef = useRef<HTMLDivElement>(null)

  // Inizializza stato sezioni da initiallyCollapsed
  useEffect(() => {
    const init: Record<string, boolean> = {}
    for (const node of layoutNodes) {
      if (node.type === 'section' && !(node.id in openSections)) {
        init[node.id] = !node.initiallyCollapsed
      }
    }
    if (Object.keys(init).length > 0) {
      setOpenSections(prev => ({ ...init, ...prev }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutNodes])

  const toggleSection = (id: string) =>
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))

  // Chiudi impostazioni cliccando fuori
  useEffect(() => {
    if (!showSettings) return
    const h = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node))
        setShowSettings(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showSettings])

  // Flatten per modal collapsed: tutti i nodi visibili come icone piatte
  const flatNodes: ResolvedNode[] = layoutNodes.flatMap(n => {
    if (!n.visible) return []
    if (n.type === 'separator') return []
    if (n.type === 'section') return (n.children ?? []).filter(c => c.visible)
    return [n]
  })

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      {collapsed ? (
        <div className="flex items-center justify-center shrink-0"
          style={{ height: 'var(--header-height)', borderBottom: '1px solid var(--color-border)' }}>
          <AppLogo size={28} />
        </div>
      ) : (
        <div className="relative shrink-0 px-4 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {onClose && (
            <button onClick={onClose} className="btn-icon absolute top-2 right-2 z-10"
              style={{ color: 'var(--color-text-muted)' }} aria-label="Chiudi menu">
              <X className="w-4 h-4" />
            </button>
          )}
          <AppLogo fullWidth />
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto space-y-0.5"
        style={{ padding: collapsed ? '16px 8px' : '16px 12px' }}>

        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn('flex items-center gap-3 py-2 rounded-lg animate-pulse', collapsed ? 'justify-center px-0' : 'px-3')}>
            <div className="w-5 h-5 rounded" style={{ backgroundColor: 'var(--color-border)' }} />
            {!collapsed && <div className="h-3 rounded flex-1" style={{ backgroundColor: 'var(--color-border)' }} />}
          </div>
        ))}

        {!loading && (
          collapsed
            ? /* Icon-only: lista piatta */
              flatNodes.map(node => {
                if (node.type === 'builtin') {
                  const icons: Record<string, React.ElementType> = { dashboard: Home, calendario: Calendar }
                  const hrefs: Record<string, string> = { dashboard: '/home', calendario: '/calendario' }
                  const Ico = icons[node.id]
                  return <VoceNav key={node.id} href={hrefs[node.id] ?? '/'} label={node.label} icona={Ico} collapsed={true} onClick={onClose} />
                }
                if (node.type === 'anagrafica') {
                  return <VoceAnagrafica key={node.id} node={node} collapsed={true} onClick={onClose} />
                }
                return null
              })
            : /* Full: rendering strutturato */
              layoutNodes.map(node => {
                if (!node.visible) return null
                if (node.type === 'separator') return (
                  <div key={node.id} className="my-2 border-t" style={{ borderColor: 'var(--color-border)' }} />
                )
                if (node.type === 'builtin') {
                  const icons: Record<string, React.ElementType> = { dashboard: Home, calendario: Calendar }
                  const hrefs: Record<string, string> = { dashboard: '/home', calendario: '/calendario' }
                  return (
                    <VoceNav key={node.id}
                      href={hrefs[node.id] ?? '/'} label={node.label}
                      icona={icons[node.id]} collapsed={false} onClick={onClose} />
                  )
                }
                if (node.type === 'section') {
                  return (
                    <Sezione key={node.id} node={node} collapsed={false}
                      isOpen={openSections[node.id] ?? !node.initiallyCollapsed}
                      onToggle={() => toggleSection(node.id)} onClick={onClose} />
                  )
                }
                if (node.type === 'anagrafica') {
                  return <VoceAnagrafica key={node.id} node={node} collapsed={false} onClick={onClose} />
                }
                return null
              })
        )}

        {/* Separatore e Pannello Controllo (sempre in fondo per admin) */}
        {!loading && ruolo === 'admin' && (
          <>
            <div className={collapsed ? 'my-3 border-t' : 'pt-3'} style={{ borderColor: 'var(--color-border)' }} />
            <VoceNav href="/controllo" label="Pannello Controllo" icona={Settings} collapsed={collapsed} onClick={onClose} />
          </>
        )}
      </nav>

      {/* Footer impostazioni */}
      <div ref={settingsRef} className="relative shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
        {showSettings && (
          <div className="absolute" style={{ bottom: '100%', left: collapsed ? 68 : 8, marginBottom: 8, zIndex: 60 }}>
            <ImpostazioniPopover
              mode={mode} onModeChange={onModeChange}
              theme={theme} onThemeChange={onThemeChange}
              onClose={() => setShowSettings(false)}
            />
          </div>
        )}
        <button
          onClick={() => setShowSettings(v => !v)}
          title="Impostazioni"
          className={cn(
            'w-full flex items-center gap-3 text-sm transition-colors',
            collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3',
            showSettings ? 'text-brand bg-surface-hover' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
          )}
          aria-label="Impostazioni sidebar e tema" aria-expanded={showSettings}
        >
          <Settings className="w-4 h-4 shrink-0" style={showSettings ? { color: 'var(--color-brand)' } : undefined} />
          {!collapsed && <span>Impostazioni</span>}
        </button>
      </div>
    </div>
  )
}

// ── Sidebar (esportazione principale) ────────────────────────

export function Sidebar({ ruolo }: SidebarProps) {
  const [isOpen, setIsOpen]           = useState(false)
  const [layoutNodes, setLayoutNodes] = useState<ResolvedNode[]>([])
  const [loading, setLoading]         = useState(true)
  const [mode, setMode]               = useState<SidebarMode>('open')
  const [theme, setTheme]             = useState<Theme>('light')
  const [isHovered, setIsHovered]     = useState(false)

  const isCollapsed = mode === 'icons' || (mode === 'hover' && !isHovered)

  // Persistenza modalità e tema
  useEffect(() => {
    const m = localStorage.getItem('sidebar-mode') as SidebarMode | null
    const t = localStorage.getItem('theme') as Theme | null
    if (m && ['open','icons','hover'].includes(m)) setMode(m)
    if (t === 'dark' || t === 'light') setTheme(t)
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', mode === 'open' ? W_FULL : W_ICON)
    localStorage.setItem('sidebar-mode', mode)
  }, [mode])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Toggle mobile
  const handleToggle = useCallback(() => setIsOpen(v => !v), [])
  useEffect(() => {
    window.addEventListener('sidebar:toggle', handleToggle)
    return () => window.removeEventListener('sidebar:toggle', handleToggle)
  }, [handleToggle])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setIsOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Fetch layout
  useEffect(() => {
    fetch('/api/controllo/layout')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.resolved)) setLayoutNodes(data.resolved)
      })
      .catch(() => {
        // Fallback: fetch solo anagrafiche con struttura hardcoded
        fetch('/api/anagrafiche')
          .then(r => r.json())
          .then(data => {
            const anas = Array.isArray(data.anagrafiche) ? data.anagrafiche : []
            setLayoutNodes([
              { type: 'builtin', id: 'dashboard', label: 'Dashboard', href: '/home', icon: 'home', visible: true },
              {
                type: 'section', id: 'anagrafiche', label: 'Anagrafiche', visible: true, initiallyCollapsed: false,
                children: anas.map((a: { slug: string; nome: string; icona: string; colore: string }) => ({
                  type: 'anagrafica', id: a.slug, label: a.nome, icon: a.icona,
                  colore: a.colore, href: `/anagrafica/${a.slug}`, visible: true,
                })),
              },
              { type: 'builtin', id: 'calendario', label: 'Calendario', href: '/calendario', icon: 'calendar', visible: true },
            ])
          })
          .catch(() => {})
      })
      .finally(() => setLoading(false))
  }, [])

  const shared = { ruolo, layoutNodes, loading, mode, theme, onModeChange: setMode, onThemeChange: setTheme }

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30"
        style={{
          width: isCollapsed ? W_ICON : W_FULL,
          transition: 'width 250ms ease',
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          boxShadow: mode === 'hover' && isHovered ? 'var(--shadow-lg)' : undefined,
        }}
        onMouseEnter={() => mode === 'hover' && setIsHovered(true)}
        onMouseLeave={() => mode === 'hover' && setIsHovered(false)}
        aria-label="Navigazione principale"
      >
        <SidebarContent {...shared} collapsed={isCollapsed} />
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsOpen(false)}
          aria-hidden="true" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
      )}

      {/* Drawer mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          width: W_FULL,
          backgroundColor: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
        }}
        aria-label="Navigazione principale" aria-hidden={!isOpen}
      >
        <SidebarContent {...shared} collapsed={false} onClose={() => setIsOpen(false)} />
      </aside>
    </>
  )
}

export default Sidebar
