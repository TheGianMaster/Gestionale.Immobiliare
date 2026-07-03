# 🖥️ DOC-10 — UI LAYOUT & NAVIGAZIONE
> **Leggi questo file per:** T-030, T-031, T-032
> **File chiave:** `src/app/(dashboard)/layout.tsx`, `src/components/layout/`

---

## 1. STRUTTURA LAYOUT PRINCIPALE

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (fixed, h=64px)                                     │
│  [≡ menu]  Logo/Nome App  [breadcrumb]    [🔔3] [User ▾]   │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  SIDEBAR    │  CONTENUTO PRINCIPALE                         │
│  (fixed,    │  (scrollabile, padding top = header height)   │
│  w=256px)   │                                               │
│             │                                               │
│  Dashboard  │                                               │
│  ─────────  │                                               │
│  👥 Clienti │                                               │
│  🏢 Fornit. │                                               │
│  📦 Prodotti│                                               │
│  ─────────  │                                               │
│  📅 Calend. │                                               │
│  ─────────  │                                               │
│  ⚙️ Pannell │                                               │
│             │                                               │
│  [v 1.0.0]  │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

---

## 2. LAYOUT RESPONSIVE

### Desktop (≥ 1024px)
- Sidebar fissa a sinistra, larghezza 256px
- Contenuto: `margin-left: 256px`
- Header: `left: 256px` (a destra della sidebar)

### Tablet (768px - 1023px)
- Sidebar collapsata (nascosta di default)
- Hamburger nel header per aprire sidebar come overlay
- Contenuto: full-width
- Header: full-width con hamburger a sinistra

### Mobile (< 768px)
- Sidebar: drawer dal basso o slide-in sinistro
- Overlay scuro quando sidebar aperta
- Touch gesture per chiudere (swipe sinistra)
- Contenuto: full-width, padding ridotto

---

## 3. LAYOUT TSX — STRUTTURA

```tsx
// src/app/(dashboard)/layout.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar — nascosta su mobile, fissa su desktop */}
      <Sidebar />

      {/* Contenuto principale */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-sidebar">
        {/* Header fisso */}
        <Header user={session.user} />

        {/* Area scrollabile */}
        <main className="flex-1 overflow-y-auto pt-header">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

---

## 4. SIDEBAR — COMPORTAMENTO

```tsx
// src/components/layout/Sidebar.tsx
// 'use client' — necessario per state isOpen

// STATE:
// - isOpen: boolean (mobile/tablet)
// - anagrafiche: IAnagraficaConfig[] (caricata da API)

// CARICAMENTO ANAGRAFICHE:
// fetch('/api/anagrafiche') al mount
// Mostra skeleton durante loading

// VOCI SIDEBAR:
// 1. [🏠 Dashboard] → /
// 2. Separatore "ANAGRAFICHE"
// 3. Per ogni anagrafica: [ICONA NOME] → /anagrafica/[slug]
// 4. Separatore
// 5. [📅 Calendario] → /calendario
// 6. Separatore
// 7. [⚙️ Pannello Controllo] → /controllo (visibile solo ad admin)

// VOCE ATTIVA:
// usePathname() per rilevare la route corrente
// Voce attiva: background var(--color-brand-light), text var(--color-brand), bold

// FOOTER:
// Versione app (da package.json o env)
// Link a docs (se presente)
```

---

## 5. HEADER — STRUTTURA

```tsx
// src/components/layout/Header.tsx
// 'use client' per i componenti interattivi

// LAYOUT HEADER:
// ┌────────────────────────────────────────────────────────┐
// │ [≡]  [Logo]  [/ Dashboard / Clienti / Mario R.]  [🔔3] [Mario R. ▾] │
// └────────────────────────────────────────────────────────┘

// ELEMENTI:
// - Hamburger button (mobile/tablet): toggle sidebar
// - Logo: nome app o immagine (configurabile)
// - Breadcrumb (desktop): generato da usePathname()
// - NotificationBell: componente separato
// - UserMenu: componente dropdown

// BREADCRUMB:
// Path: /anagrafica/clienti/abc123/view
// Breadcrumb: Dashboard > Clienti > Mario Rossi > Vista
// Il nome della scheda è caricato dalla scheda stessa (se disponibile in context)
// Fallback: usa l'ID (da migliorare in futuro con cache)
```

---

## 6. USER MENU

```tsx
// src/components/layout/UserMenu.tsx
// Dropdown con @radix-ui/react-dropdown-menu

// TRIGGER:
// Avatar (iniziali nome in cerchio colorato) + Nome utente + ▾

// DROPDOWN:
// ┌──────────────────────────┐
// │ 👤 Mario Rossi            │
// │    mario@example.com      │
// │    [Admin]  ← badge ruolo │
// ├──────────────────────────┤
// │    Profilo (WIP)          │
// │    Impostazioni (WIP)     │
// ├──────────────────────────┤
// │ 🚪 Esci                  │
// └──────────────────────────┘

// LOGOUT:
// signOut() da next-auth → redirect a /login
```

---

## 7. PRINCIPI UI — LEGGIBILITÀ

### Per l'operatore umano
- **Font size minimo:** 14px per testo normale, 12px per metadata
- **Line height:** 1.5 per testo, 1.2 per headings
- **Contrasto:** rispetta WCAG AA (4.5:1 per testo normale)
- **Spaziatura:** generosa tra voci di lista (min 8px gap)
- **Colori:** non usare mai il colore come unico indicatore (aggiungi icona o testo)

### Per la leggibilità da agente AI (commenti codice)
- Ogni file: commento in cima con descrizione funzionalità
- Ogni funzione/componente complesso: JSDoc
- Ogni API route: commento con endpoint, metodo, parametri
- Ogni hook custom: commento con scopo e dipendenze
- I TODO sono sempre commentati con: `// TODO: [descrizione] (WIP → Pannello Controllo > [sezione])`

### Responsive — Regole
- Mobile-first: scrivi stili base per mobile, aggiungi breakpoint per desktop
- Touch target minimo: 44x44px su mobile
- Testo mai < 14px su mobile
- Form su mobile: campi full-width, label sempre visibile (non solo placeholder)
- Tabelle su mobile: trasforma in card list (ogni riga → card)

---

## 6. SEZIONI STATICHE SIDEBAR (SezioneFissa)

Le sezioni dinamiche (Anagrafiche) vengono dal DB tramite `/api/controllo/layout`.
Le sezioni statiche usano il componente `SezioneFissa` hardcoded in `Sidebar.tsx`.

```typescript
// Interfaccia SezioneFissa
{
  label: string                                                // nome sezione
  collapsed: boolean                                           // da props Sidebar
  items: { href: string; label: string; icon: React.ElementType }[]
  onNavClick?: () => void
}
```

**Sezioni statiche attuali:**
- **Bilancio** — `items: [{ href: '/bilancio/overview', label: 'Overview', icon: BarChart2 }]`

**Ordine voci nella sidebar (espansa):**
1. Voci builtin (Dashboard, Calendario) — dal DB layout
2. Sezioni anagrafiche dinamiche — dal DB layout
3. **Bilancio** (SezioneFissa — hardcoded)
4. Separatore + Pannello Controllo (solo admin — hardcoded)

---

## 7. MODALITÀ COLLAPSED E SEZIONEFISSA

In modalità `icons` (solo icone), `SezioneFissa` renderizza:
```tsx
<>
  <div className="my-2 border-t" />   {/* separatore visivo */}
  <VoceNav href="..." icona={Icon} collapsed={true} />  {/* solo icona, no testo */}
</>
```

Il tooltip `title` è fornito da `VoceNav` (`title={collapsed ? label : undefined}`).

---

## 8. MAPPA ROUTE DASHBOARD COMPLETA

```
/home                          ← Dashboard principale
/anagrafica/[slug]             ← Lista schede
/anagrafica/[slug]/new         ← Nuova scheda
/anagrafica/[slug]/[id]/view   ← Vista scheda
/anagrafica/[slug]/[id]/edit   ← Modifica scheda
/anagrafica/[slug]/[id]/documenti ← Documenti scheda
/calendario                    ← Calendario
/notifiche                     ← Lista notifiche
/controllo                     ← Pannello Controllo (admin)
/bilancio/overview             ← Bilancio Overview (WIP)
```

