/**
 * GET /api/controllo/layout  — lettura layout sidebar (tutti gli utenti auth)
 * PUT /api/controllo/layout  — salvataggio layout (solo admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { AnagraficaConfig } from '@/models/AnagraficaConfig'
import { SidebarLayout } from '@/models/SidebarLayout'

// ─── Tipi condivisi ────────────────────────────────────────────────────────────

export interface SidebarNodeBuiltin {
  type: 'builtin'
  key: 'dashboard' | 'calendario'
  label: string
  visible: boolean
}

export interface SidebarNodeSection {
  type: 'section'
  id: string
  label: string
  icon?: string
  visible: boolean
  initiallyCollapsed: boolean
  children: SidebarNodeAnagrafica[]
}

export interface SidebarNodeAnagrafica {
  type: 'anagrafica'
  slug: string
  visible: boolean
}

export interface SidebarNodeSeparator {
  type: 'separator'
  id: string
  visible: boolean
}

export type SidebarRootNode =
  | SidebarNodeBuiltin
  | SidebarNodeSection
  | SidebarNodeAnagrafica
  | SidebarNodeSeparator

export interface ResolvedNode {
  type: string
  id: string
  label: string
  icon?: string
  colore?: string
  href?: string
  visible: boolean
  initiallyCollapsed?: boolean
  children?: ResolvedNode[]
}

export interface LayoutGetResponse {
  nodes: SidebarRootNode[]
  resolved: ResolvedNode[]
}

// ─── Risoluzione nodi ─────────────────────────────────────────────────────────

interface AnaInfo { slug: string; nome: string; icona: string; colore: string }

function resolveOne(node: SidebarRootNode, anaMap: Map<string, AnaInfo>): ResolvedNode[] {
  if (node.type === 'builtin') {
    const hrefs: Record<string, string> = { dashboard: '/home', calendario: '/calendario' }
    const icons: Record<string, string> = { dashboard: 'home', calendario: 'calendar' }
    return [{
      type: 'builtin', id: node.key, label: node.label,
      href: hrefs[node.key] ?? '/', icon: icons[node.key],
      visible: node.visible,
    }]
  }
  if (node.type === 'section') {
    return [{
      type: 'section', id: node.id, label: node.label, icon: node.icon,
      visible: node.visible, initiallyCollapsed: node.initiallyCollapsed,
      children: node.children.flatMap(c => {
        const ana = anaMap.get(c.slug)
        if (!ana) return []
        return [{
          type: 'anagrafica', id: c.slug, label: ana.nome, icon: ana.icona,
          colore: ana.colore, href: `/anagrafica/${c.slug}`, visible: c.visible,
        }]
      }),
    }]
  }
  if (node.type === 'anagrafica') {
    const ana = anaMap.get(node.slug)
    if (!ana) return []
    return [{
      type: 'anagrafica', id: node.slug, label: ana.nome, icon: ana.icona,
      colore: ana.colore, href: `/anagrafica/${node.slug}`, visible: node.visible,
    }]
  }
  if (node.type === 'separator') {
    return [{ type: 'separator', id: node.id, label: '', visible: node.visible }]
  }
  return []
}

function resolveNodes(nodes: SidebarRootNode[], anaMap: Map<string, AnaInfo>): ResolvedNode[] {
  return nodes.flatMap(n => resolveOne(n, anaMap))
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    await connectDB()

    const anagrafiche = await AnagraficaConfig.find({ attiva: true })
      .sort({ ordine: 1, nome: 1 }).lean()

    const anaMap = new Map<string, AnaInfo>(
      anagrafiche.map(a => [a.slug, { slug: a.slug, nome: a.nome, icona: a.icona, colore: a.colore }])
    )

    const doc = await SidebarLayout.findOne({}).lean() as { nodes?: SidebarRootNode[] } | null

    let nodes: SidebarRootNode[]

    if (!doc || !Array.isArray(doc.nodes) || doc.nodes.length === 0) {
      // Layout predefinito
      nodes = [
        { type: 'builtin', key: 'dashboard', label: 'Dashboard', visible: true },
        {
          type: 'section', id: 'sezione-anagrafiche', label: 'Anagrafiche',
          icon: '📁', visible: true, initiallyCollapsed: false,
          children: anagrafiche.map(a => ({ type: 'anagrafica', slug: a.slug, visible: true })),
        },
        { type: 'builtin', key: 'calendario', label: 'Calendario', visible: true },
      ] as SidebarRootNode[]
    } else {
      nodes = doc.nodes as SidebarRootNode[]
    }

    const resolved = resolveNodes(nodes, anaMap)

    return NextResponse.json({ nodes, resolved } satisfies LayoutGetResponse)
  } catch (err) {
    console.error('[GET /api/controllo/layout]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.ruolo !== 'admin')
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { nodes } = await req.json() as { nodes: SidebarRootNode[] }
    if (!Array.isArray(nodes))
      return NextResponse.json({ error: 'nodes deve essere un array' }, { status: 400 })

    await connectDB()
    await SidebarLayout.findOneAndUpdate(
      {},
      { $set: { nodes } },
      { upsert: true, new: true }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PUT /api/controllo/layout]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
