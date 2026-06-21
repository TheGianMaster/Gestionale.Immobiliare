# 📋 DOC-03 — MOTORE ANAGRAFICA
> **Leggi questo file per:** T-040, T-041, T-042, T-043, T-044
> **File chiave:** `src/app/(dashboard)/anagrafica/`, `src/app/api/anagrafiche/`, `src/components/anagrafica/`

---

## 1. CONCETTI CHIAVE

```
AnagraficaConfig (es: "Clienti")
  │
  ├── Variabili (es: nome, email, telefono, tipo_cliente)
  ├── Varianti (es: "Privato" → nasconde "piva")
  └── Schede (record effettivi: Mario Rossi, Luca Bianchi, ...)
          │
          └── Documenti (file caricati sulla scheda)
```

**Flusso navigazione:**
```
Sidebar → /anagrafica/clienti (preview lista)
  → click riga → /anagrafica/clienti/[id]/view
  → click edit → /anagrafica/clienti/[id]/edit
  → click "Nuova scheda" → /anagrafica/clienti/new/edit
```

---

## 2. API ROUTES — SPECIFICA COMPLETA

### GET /api/anagrafiche
```typescript
// Lista tutte le AnagraficaConfig attive, ordinate per `ordine`
// Response:
{
  data: IAnagraficaConfig[]
}

// Note:
// - Esclude la lista variabili (solo metadati per la sidebar)
// - Filtra attiva: true
// - Ordina per ordine ASC
```

### GET /api/anagrafiche/[slug]
```typescript
// Config completa di una singola anagrafica, con variabili popolate
// Response:
{
  data: IAnagraficaConfig & {
    variabiliPopulate: IVariabile[]
    varianti: IVariante[]
  }
}
// 404 se slug non trovato o non attiva
```

### GET /api/anagrafiche/[slug]/schede
```typescript
// Lista schede con paginazione e ricerca
// Query params:
// - page: number (default 1)
// - limit: number (default 20, max 100)
// - q: string (ricerca full-text sui previewColumns)
// - variantID: string (filtra per variante)
// - sortBy: string (campo, default createdAt)
// - sortDir: 'asc'|'desc' (default desc)

// Response:
{
  data: IScheda[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    hasMore: boolean
  }
}

// ——— LOGICA RICERCA ———
// La ricerca opera SOLO sui campi definiti in previewColumns dell'AnagraficaConfig
// Esempio per clienti con previewColumns: ['nome', 'cognome', 'email']:
// db.collection.find({
//   anagraficaSlug: slug,
//   attiva: true,
//   $or: [
//     { 'dati.nome': { $regex: q, $options: 'i' } },
//     { 'dati.cognome': { $regex: q, $options: 'i' } },
//     { 'dati.email': { $regex: q, $options: 'i' } }
//   ]
// })
```

### POST /api/anagrafiche/[slug]/schede
```typescript
// Crea una nuova scheda
// Body: { dati: Record<string, any>, variantID?: string }
// Validazione con buildSchedaSchema (vedi docs/04-VARIABILI.md)
// Aggiunge automaticamente createdBy dalla sessione
// Response: { data: IScheda }
```

### GET|PUT|DELETE /api/anagrafiche/[slug]/schede/[id]
```typescript
// GET: Leggi scheda singola con info anagrafica (per il breadcrumb)
// PUT: Aggiorna dati scheda (validazione Zod, aggiorna updatedBy)
// DELETE: Soft delete → { attiva: false }
//         Non eliminazione fisica per safety
//         Response: { success: true }
```

---

## 3. COMPONENTE PREVIEW TABLE

### Struttura HTML/CSS
```
┌─────────────────────────────────────────────────────────┐
│  [Titolo Anagrafica]              [+ Nuova Scheda]      │
│  ┌──────────────────────────────────────────┐           │
│  │ 🔍 Cerca in clienti...                   │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  ┌──────┬──────────┬──────────┬──────────┬──────────┐  │
│  │      │ Nome     │ Email    │ Telefono │ Variante │  │  ← previewColumns
│  ├──────┼──────────┼──────────┼──────────┼──────────┤  │
│  │      │ Mario R. │ mario@.. │ 333...   │ Privato  │  │
│  │      │          │          │          │    [View][Edit][Del] │ ← appare su hover
│  ├──────┼──────────┼──────────┼──────────┼──────────┤  │
│  │      │ Luca B.  │ luca@..  │ 347...   │ Azienda  │  │
│  └──────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                          │
│  ← Precedente    Pagina 1 di 5    Successiva →          │
└─────────────────────────────────────────────────────────┘
```

### Comportamento hover
```typescript
// Ogni riga ha gruppo hover. Su hover:
// - Sfondo riga leggermente evidenziato
// - Appaiono a destra: 3 pulsanti icon-only con tooltip
//   - 👁 View: naviga a /anagrafica/[slug]/[id]/view
//   - ✏️ Edit: naviga a /anagrafica/[slug]/[id]/edit
//   - 🗑️ Delete: apre DeleteConfirmModal

// CSS pattern:
// <tr className="group hover:bg-surface-hover">
//   ...celle...
//   <td className="opacity-0 group-hover:opacity-100 transition-opacity">
//     [pulsanti azione]
//   </td>
// </tr>
```

### DeleteConfirmModal
```typescript
// Modale di conferma eliminazione
// Titolo: "Elimina scheda"
// Testo: "Sei sicuro di voler eliminare [LABEL SCHEDA]? Questa azione non può essere annullata."
// Pulsanti:
//   [Annulla]  [Elimina]  ← "Elimina" in rosso (variante danger)
// Dopo conferma: chiamata DELETE API → rimuove dalla lista → toast success
```

---

## 4. PAGINA VIEW SCHEDA

```
┌──────────────────────────────────────────────────────┐
│ ← Dashboard > Clienti > Mario Rossi     [Modifica]  │
├──────────────────────────────────────────────────────┤
│  [Dati]  [Documenti]                                 │  ← Tab navigation
├──────────────────────────────────────────────────────┤
│                                                      │
│  Variante: [Privato]                  (badge)        │
│                                                      │
│  ┌─────────────┬────────────────────────────────┐   │
│  │ Nome        │ Mario                          │   │
│  │ Cognome     │ Rossi                          │   │
│  │ Email       │ mario@example.com              │   │
│  │ Telefono    │ +39 333 1234567                │   │
│  │ Note        │ Cliente storico, pagamenti...  │   │
│  └─────────────┴────────────────────────────────┘   │
│                                                      │
│  Creata il: 12/01/2025 · Da: Admin Sistema           │
│  Ultima modifica: 15/01/2025 · Da: Operatore         │
└──────────────────────────────────────────────────────┘
```

---

## 5. FORM SCHEDA (Crea/Edit)

### Flusso variantID
```typescript
// 1. Al caricamento del form:
//    - Carica le varianti disponibili per questa anagrafica
//    - Se la scheda ha già un variantID, preselezionalo
//
// 2. Campo variantID in cima al form (se varianti disponibili)
//
// 3. Al cambio variantID:
//    - Richiama la variante dal db (o usa quella già caricata)
//    - Aggiorna lo state `campiOsculti` con variante.variabiliOsculte
//    - I campi in `campiOsculti` vengono nascosti con animazione
//    - I campi in variante.variabiliObbligatorie diventano obbligatori
//
// 4. Submit:
//    - Costruisci lo schema Zod con buildSchedaSchema(variabili, variantID)
//    - Valida i dati
//    - POST/PUT all'API
//    - In caso di errore: mostra messaggi inline per campo
//    - In caso di successo: redirect a view
```

### Gestione errori form
```typescript
// Ogni campo ha un attributo `error` che viene passato al FieldRenderer
// Esempio struttura errori:
type FormErrors = Record<string, string>
// { nome: "Il campo è obbligatorio", email: "Formato email non valido" }
```

---

## 6. RICERCA — IMPLEMENTAZIONE DEBOUNCE

```typescript
// src/components/anagrafica/SearchBar.tsx
import { useCallback, useState } from 'react'
import { useDebouncedCallback } from 'use-debounce'  // o implementa manuale

const SearchBar = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [value, setValue] = useState('')

  const debouncedSearch = useDebouncedCallback((searchTerm: string) => {
    onSearch(searchTerm)
  }, 400)  // 400ms debounce — abbastanza lento da non spammare il db

  return (
    <input
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        debouncedSearch(e.target.value)
      }}
      placeholder={`Cerca...`}
    />
  )
}
```

**IMPORTANTE:** La ricerca chiama il server (MongoDB), non filtra solo i dati già caricati. Questo assicura che la ricerca funzioni su tutto il dataset, non solo sulla pagina corrente.
