# 🔔 DOC-07 — SISTEMA NOTIFICHE
> **Leggi questo file per:** T-080, T-081
> **File chiave:** `src/components/notifiche/`, `src/app/api/notifiche/`, `src/lib/notifiche.ts`

---

## 1. ARCHITETTURA

```
Sistema                    API                   UI
  │                         │                    │
  ├─ Evento creato     →  creaNotifica()  →  NotificationBell
  ├─ Scheda modificata →  creaNotifica()  →  [counter +1]
  └─ ...               →  creaNotifica()  →  [dropdown]
                                              [/notifiche]
```

**Tipo trasporto:** polling ogni 60 secondi (no WebSocket per semplicità iniziale)

---

## 2. UTILITY CREA NOTIFICA

```typescript
// src/lib/notifiche.ts
// Funzione riutilizzabile da qualsiasi API route per creare notifiche

import connectDB from '@/lib/mongodb'
import { Notifica } from '@/models/Notifica'

interface CreaNotificaOptions {
  userId: string
  titolo: string
  messaggio: string
  tipo: 'info' | 'success' | 'warning' | 'error'
  link?: string
}

export async function creaNotifica(opts: CreaNotificaOptions): Promise<void> {
  await connectDB()
  await Notifica.create({
    userId: opts.userId,
    titolo: opts.titolo,
    messaggio: opts.messaggio,
    tipo: opts.tipo,
    link: opts.link,
    letta: false,
  })
}

// ESEMPI DI USO:
// Nel POST /api/anagrafiche/[slug]/schede:
//   await creaNotifica({ userId, titolo: 'Scheda creata', tipo: 'success', ... })
//
// Nel POST /api/calendario:
//   Per ogni partecipante diverso dal creatore:
//   await creaNotifica({ userId: partecipanteId, titolo: 'Sei invitato a...', ... })
```

---

## 3. API NOTIFICHE

```typescript
// GET /api/notifiche/count
// Response: { count: number }  ← solo non lette per l'utente corrente
// Usato dalla campanellina per polling

// GET /api/notifiche
// Query: ?letta=false&limit=5&page=1
// Response: { data: INotifica[], meta: { total, unread } }

// PATCH /api/notifiche/[id]/leggi
// Body: {}
// Aggiorna letta=true per la notifica specificata
// Response: { success: true }

// PATCH /api/notifiche/leggi-tutte
// Aggiorna letta=true per tutte le notifiche non lette dell'utente
// Response: { success: true, count: number }
```

---

## 4. COMPONENTE NOTIFICATION BELL

```typescript
// src/components/layout/NotificationBell.tsx (o src/components/notifiche/)

// ——— STRUTTURA ———
// [🔔] ← icona campanellina (BellIcon da lucide)
//  [3] ← badge rosso con numero (nascosto se 0)

// ——— POLLING ———
// useEffect con setInterval ogni 60000ms
// Chiama GET /api/notifiche/count
// Aggiorna stato `unreadCount`
// Cleanup interval on unmount

// ——— BADGE ———
// Se unreadCount === 0: badge hidden
// Se unreadCount > 99: mostra "99+"
// Animazione pulse quando arriva nuova notifica (compare il badge)

// ——— DROPDOWN ———
// @radix-ui/react-popover o @radix-ui/react-dropdown-menu
// Si apre sotto la campanellina
// Carica le ultime 5 notifiche al click (non durante polling per risparmiare)
```

---

## 5. DROPDOWN NOTIFICHE

```
┌────────────────────────────────────────────┐
│  Notifiche                [Segna tutte ✓]  │
├────────────────────────────────────────────┤
│ 🟢 • Scheda creata                3m fa    │  ← non letta (sfondo evidenziato)
│     Mario Rossi è stato aggiunto         │
├────────────────────────────────────────────┤
│ 🔵   Evento aggiornato           1h fa     │  ← letta (sfondo normale)
│     Riunione team modificata              │
├────────────────────────────────────────────┤
│ 🔴 • Errore upload               2h fa     │  ← non letta
│     Impossibile caricare documento        │
├────────────────────────────────────────────┤
│          → Vedi tutte le notifiche         │
└────────────────────────────────────────────┘
```

### Regole UI dropdown
- Larghezza fissa: 360px (desktop), 100vw - 16px (mobile)
- Ogni notifica: click → segna come letta + naviga al link (se presente)
- Icona tipo: 🟢 success, 🔵 info, 🟡 warning, 🔴 error
- Punto colorato a sinistra per notifiche non lette
- Data: formato relativo ("3 minuti fa", "1 ora fa", "ieri", "12 gen")
- Max 5 notifiche in dropdown
- "Segna tutte" chiama PATCH /api/notifiche/leggi-tutte poi ri-fetcha

---

## 6. PAGINA NOTIFICHE COMPLETA

```
// src/app/(dashboard)/notifiche/page.tsx

// Lista completa di tutte le notifiche dell'utente
// Paginata (20 per pagina)
// Filtri: Tutte | Non lette
// Ogni notifica mostra titolo, messaggio completo, tipo, data

// Layout simile al dropdown ma espanso
// Azioni: [✓ Segna come letta] per singola notifica (o già letta se cliccata)
```

---

## 7. QUANDO CREARE NOTIFICHE (TRIGGER)

Aggiungi `creaNotifica()` in questi punti del sistema:

| Evento | Destinatario | Tipo | Messaggio |
|--------|-------------|------|-----------|
| Nuova scheda creata | admin | info | "[Nome] aggiunto in [Anagrafica]" |
| Scheda eliminata | admin | warning | "[Nome] eliminato da [Anagrafica]" |
| Documento caricato | admin | info | "Documento caricato su [Nome scheda]" |
| Evento calendario creato (con partecipanti) | ogni partecipante | info | "Sei invitato a: [Titolo evento]" |
| Errore sistema | admin | error | Descrizione errore |

**NOTA:** In questa fase iniziale, i trigger sono manuali nelle API route. Le automazioni (via pannello Automazioni — WIP) implementeranno trigger configurabili.
