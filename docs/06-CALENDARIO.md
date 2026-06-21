# 📅 DOC-06 — SISTEMA CALENDARIO
> **Leggi questo file per:** T-070, T-071, T-072
> **File chiave:** `src/components/calendario/`, `src/app/api/calendario/`, `src/models/Evento.ts`
> **⚠️ Database:** questo modulo usa `MONGODB_URI_EVENTI` — cluster separato!

---

## 1. STRUTTURA VISTE

Il calendario ha due viste principali, switchabili con pulsanti in alto:

```
[Vista Mese]  [Vista Giorno]      ←  Oggi →       Giugno 2025
```

---

## 2. VISTA MESE

```
┌──────────────────────────────────────────────────────────────┐
│  ← Mag 2025    Giugno 2025    Lug 2025 →    [Oggi]          │
│  [Mese] [Giorno]                                             │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Lun │ Mar │ Mer │ Gio │ Ven │ Sab │ Dom │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  26 │  27 │  28 │  29 │  30 │  31 │   1 │  ← giorni fuori mese: opacità ridotta
│     │     │     │[+]  │     │     │     │  ← [+] su hover per aggiungere evento
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│   2 │   3 │   4 │   5 │   6 │   7 │   8 │
│ ████│     │ ████│     │ ██  │     │     │  ← evento pill colorato
│ Riu.│     │ Cli.│     │altri│     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  ...                                     │
└──────────────────────────────────────────┘
```

### Regole visualizzazione eventi in cella
- Max 3 eventi per cella (in ordine cronologico per ora inizio)
- Se ci sono più di 3 eventi: mostra "altri N" come ultimo elemento cliccabile
- Click su "altri N": switcha a vista giorno per quel giorno
- Ogni evento: pill colorato (`background: evento.colore + '20'`, `border: evento.colore`, `color: evento.colore`)
- Testo troncato con ellipsis se non ci sta
- Click su evento: apre EventModal in modalità view

---

## 3. VISTA GIORNO

```
┌──────────────────────────────────────────────────────────────┐
│  ← Dom    Lunedì 9 Giugno 2025    Mar →    [Oggi]           │
│  [Mese] [Giorno]                           [+ Nuovo evento] │
├──────────────────────────────────────────────────────────────┤
│ Tutto il giorno │  [████ Compleanno Luca ████████████████]   │
├──────────────────────────────────────────────────────────────┤
│ 08:00 │                                                      │
│ 08:30 │                                                      │
│ 09:00 │ [███████ Riunione team ████████████]                 │
│ 09:30 │ [███████████████████████████████████]                │
│ 10:00 │                                                      │
│ 10:30 │                                                      │
│ 11:00 │ [█ Chiamata Mario █]                                 │
│ 11:30 │                                                      │
│  ...  │                                                      │
└──────────────────────────────────────────────────────────────┘
```

### Calcolo posizione eventi
```typescript
// Altezza per slot 30 min = 40px
// Top = ((ora - 8) * 2 + (minuti / 30)) * 40px
// Height = durata_in_minuti / 30 * 40px
// Min-height = 40px (eventi < 30 min appaiono come 30 min)

function calcEventPosition(inizio: Date, fine: Date) {
  const startHour = inizio.getHours()
  const startMin = inizio.getMinutes()
  const endHour = fine.getHours()
  const endMin = fine.getMinutes()

  const SLOT_HEIGHT = 40  // px per slot 30 minuti
  const START_HOUR = 0   // mostra da mezzanotte

  const topSlots = (startHour - START_HOUR) * 2 + Math.floor(startMin / 30)
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
  const heightSlots = Math.max(1, totalMinutes / 30)

  return {
    top: topSlots * SLOT_HEIGHT,
    height: heightSlots * SLOT_HEIGHT
  }
}
```

---

## 4. EVENTMODAL — FORM COMPLETO

```typescript
// src/components/calendario/EventModal.tsx

// ——— CAMPI ———
interface EventFormData {
  titolo: string             // required
  descrizione: string        // optional, textarea
  inizio: string             // "YYYY-MM-DD"
  oraInizio: string          // "HH:MM"
  fine: string               // "YYYY-MM-DD"
  oraFine: string            // "HH:MM"
  tuttoIlGiorno: boolean
  colore: string             // hex color
  etichette: string[]        // tag liberi
  collegamentoScheda?: { id: string, label: string }  // reference opzionale
  partecipanti: string[]     // userId array
}

// ——— PALETTE COLORI EVENTO ———
// 8 colori predefiniti cliccabili (cerchi colorati)
const COLORI_EVENTO = [
  '#6366F1',  // indigo (default)
  '#EF4444',  // rosso
  '#F59E0B',  // arancione
  '#10B981',  // verde
  '#3B82F6',  // blu
  '#8B5CF6',  // viola
  '#EC4899',  // rosa
  '#6B7280',  // grigio
]

// ——— ETICHETTE (TAG) ———
// Input testo con Enter/virgola per aggiungere tag
// Ogni tag appare come pill con X per rimuovere
// Non c'è una lista predefinita — è testo libero

// ——— COLLEGAMENTO SCHEDA ———
// Reference field verso qualsiasi anagrafica
// Dropdown per selezionare prima l'anagrafica, poi la scheda
// Campo opzionale

// ——— VALIDAZIONE ———
// - titolo: required, max 100 caratteri
// - fine >= inizio
// - se tuttoIlGiorno: nasconde ore, imposta inizio=00:00, fine=23:59
```

---

## 5. API CALENDARIO

```typescript
// GET /api/calendario
// Query params:
// - mese: "YYYY-MM" → tutti gli eventi di quel mese
// - giorno: "YYYY-MM-DD" → tutti gli eventi di quel giorno
// - q: stringa ricerca nel titolo/descrizione

// Filtro:
// - L'utente vede: eventi in cui è createdBy OPPURE partecipanti include userId
// (futuro: config visibilità)

// Response: { data: IEvento[] }

// POST /api/calendario
// Body: EventFormData (convertito in IEvento con date complete)

// PUT /api/calendario/[id]
// Solo il creatore o admin possono modificare

// DELETE /api/calendario/[id]
// Solo il creatore o admin possono eliminare
```

---

## 6. GESTIONE ETICHETTE

```typescript
// Le etichette sono string[] libere sull'evento
// Non c'è una collection di etichette predefinite (al contrario di Google Calendar)
// Tuttavia, il sistema può proporre etichette usate di frequente:

// GET /api/calendario/etichette-suggerite
// Response: stringa[] (le 10 etichette più usate dall'utente)
// Implementazione:
//   db.eventi.aggregate([
//     { $match: { createdBy: userId } },
//     { $unwind: "$etichette" },
//     { $group: { _id: "$etichette", count: { $sum: 1 } } },
//     { $sort: { count: -1 } },
//     { $limit: 10 }
//   ])

// Nell'EventModal: mostra le etichette suggerite come chip cliccabili
// Click su chip suggerito → aggiunge l'etichetta senza digitare
```

---

## 7. NAVIGAZIONE TRA MESE E GIORNO

```typescript
// Stato URL-based per navigazione:
// /calendario → vista mese, mese corrente
// /calendario?view=month&month=2025-06 → vista mese specifica
// /calendario?view=day&date=2025-06-15 → vista giorno specifica

// Navigazione:
// useRouter() per push/replace
// useSearchParams() per leggere i parametri

// Il componente CalendarMonth riceve:
// - currentMonth: Date (dal search param o new Date())
// - onDayClick: (date: Date) => void → switch a vista giorno
// - onPrevMonth, onNextMonth

// Il componente CalendarDay riceve:
// - currentDate: Date
// - onPrevDay, onNextDay
// - onBackToMonth
```
