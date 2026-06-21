# 🔧 DOC-04 — TIPI DI VARIABILI (FIELD TYPE SYSTEM)
> **Leggi questo file per:** T-050 → T-056, T-131
> **File chiave:** `src/components/variabili/`, `src/lib/validators.ts`

---

## 1. OVERVIEW — I 10 TIPI DI CAMPO

| Tipo | Componente | Input HTML | Validazione |
|------|-----------|------------|-------------|
| `text` | TextField | `<input type="text">` | maxLength |
| `text-area` | TextAreaField | `<textarea>` | maxLength 5000 |
| `numbers` | NumberField | `<input type="number">` | min/max/decimali |
| `mail` | MailField | `<input type="email">` | RFC 5321 email |
| `phone` | PhoneField | `<input type="tel">` | cifre + `+()- ` |
| `data` | DateField | input + popover | formato YYYY-MM-DD |
| `select` | SelectField | Radix Select | enum opzioni |
| `reference` | ReferenceField | search input | `{id, label}` |
| `multi-reference` | MultiReferenceField | search multi | array `{id, label}` |
| `variantID` | VariantIDField | Radix Select | slug variante |

---

## 2. FIELDRENDERER — DISPATCHER CENTRALE

```typescript
// src/components/variabili/FieldRenderer.tsx
// Questo componente è l'unico punto di ingresso per renderizzare qualsiasi campo.
// Non chiamare mai i singoli field component direttamente dal form.

interface FieldRendererProps {
  variabile: IVariabile       // Configurazione del campo
  valore: any                 // Valore corrente
  mode: 'view' | 'edit'      // Modalità
  onChange?: (slug: string, valore: any) => void  // Callback cambio valore
  error?: string              // Messaggio errore (solo in edit)
  oscurato?: boolean          // Campo nascosto da variantID logic (non renderizzare)
}

// Il componente gestisce:
// 1. Se oscurato=true → return null
// 2. In mode='view' → mostra label + valore formattato (read-only)
// 3. In mode='edit' → mostra label + campo interattivo + error
// 4. Se obbligatorio → aggiungi asterisco rosso alla label
```

---

## 3. CAMPO TEXT

```typescript
// src/components/variabili/fields/TextField.tsx
// Testo breve, limite caratteri configurabile

// In edit:
// - <input type="text">
// - maxLength dal variabile.maxLength (default 255)
// - Counter caratteri in basso a destra: "45 / 255"
// - Border rosso + messaggio se error

// In view:
// - Testo semplice, "-" se vuoto
```

---

## 4. CAMPO TEXT-AREA

```typescript
// src/components/variabili/fields/TextAreaField.tsx
// Testo lungo con resize automatico

// In edit:
// - <textarea> con overflow-y: hidden e height auto-grow
// - useEffect che aggiusta altezza su ogni keystroke (scrollHeight)
// - maxLength 5000
// - Counter caratteri: "234 / 5000"
// - Min-height: 80px, max-height: 400px con scroll oltre

// In view:
// - Testo con whitespace: pre-wrap (rispetta newline)
// - Troncato a 3 righe con "Mostra tutto" se oltre
```

---

## 5. CAMPO NUMBERS

```typescript
// src/components/variabili/fields/NumberField.tsx

// In edit:
// - <input type="number">
// - step="1" se decimali=false, step="0.01" se decimali=true
// - min e max dal config Variabile
// - Rimuovi frecce default browser con CSS: -moz-appearance: textfield
// - Mostra unità di misura opzionale (dal config, campo futuro)

// In view:
// - Numero formattato (separatore migliaia: punto, decimali: virgola — it-IT locale)
```

---

## 6. CAMPO MAIL

```typescript
// src/components/variabili/fields/MailField.tsx

// In edit:
// - <input type="email">
// - Validazione live con Zod: z.string().email()
// - Icona busta/mail a sinistra nel campo
// - Errore: "Formato email non valido"

// In view:
// - Link mailto: cliccabile
// - Icona busta a sinistra del testo
```

---

## 7. CAMPO PHONE

```typescript
// src/components/variabili/fields/PhoneField.tsx

// In edit:
// - <input type="tel">
// - Pattern accettato: /^[0-9+\s\-(). ]+$/
// - NON formattazione automatica (troppo invasivo con prefissi internazionali)
// - Icona telefono a sinistra

// In view:
// - Link tel: cliccabile da mobile
// - Icona telefono a sinistra del testo
```

---

## 8. CAMPO DATA — IMPLEMENTAZIONE DETTAGLIATA

```typescript
// src/components/variabili/fields/DateField.tsx

// ——— STATE ———
const [isOpen, setIsOpen] = useState(false)
const [inputValue, setInputValue] = useState('')     // Formato visualizzato: DD/MM/YYYY
const [currentMonth, setCurrentMonth] = useState(new Date())
const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('day')
const internalValue = valore  // ISO format: YYYY-MM-DD

// ——— LOGICA INPUT MANUALE ———
// L'utente può digitare la data manualmente:
// - Inserisce cifre, il sistema aggiunge "/" automaticamente dopo posizione 2 e 5
// - Esempio: "1201" → "12/01/" → "12/01/2025"
// - On blur: valida il formato, se invalido mostra errore

// ——— MINI CALENDARIO ———
// Struttura:
// ┌────────────────────────────────┐
// │  ← Gennaio 2025 →             │  ← click su "Gennaio 2025" → viewMode='month'
// ├────────────────────────────────┤
// │  Lu  Ma  Me  Gi  Ve  Sa  Do   │
// │   .   .   1   2   3   4   5   │
// │   6   7   8   9  10  11  12   │
// │  ...                          │
// └────────────────────────────────┘
//
// viewMode='month':
// ┌────────────────────────────────┐
// │  ← 2025 →                     │  ← click su anno → viewMode='year'
// ├────────────────────────────────┤
// │  Gen  Feb  Mar  Apr           │
// │  Mag  Giu  Lug  Ago           │
// │  Set  Ott  Nov  Dic           │
// └────────────────────────────────┘
//
// viewMode='year': griglia anni ±6 dall'anno corrente

// ——— VALORE ———
// Internamente salvato come: "2025-01-12" (ISO)
// Mostrato all'utente come: "12/01/2025"
// Usa date-fns per conversioni: format, parse, isValid

// ——— POPOVER ———
// Usa @radix-ui/react-popover
// Trigger: click su input O click su icona calendario (CalendarIcon da lucide)
// Posizione: sotto il campo, allineato a sinistra
// Z-index: tokens.zIndex.popover (definito in tokens.ts)
```

---

## 9. CAMPO SELECT

```typescript
// src/components/variabili/fields/SelectField.tsx
// Usa @radix-ui/react-select

// ——— CARICAMENTO OPZIONI ———
// GET /api/select-options?variabile={slug}&anagrafica={slug}
// Response: ISelectOption[]
// Carica on mount, con loading skeleton

// ——— IN EDIT ———
// <Select.Root> di Radix con trigger personalizzato
// Ogni item mostra: [dot colorato?] label
// Opzione placeholder "Seleziona..."
// Searchable select se opzioni > 8 (filter inline)

// ——— IN VIEW ———
// Badge colorato con label se l'opzione ha un colore
// Testo semplice altrimenti

// ——— API SELECT OPTIONS ———
// GET /api/select-options → lista opzioni
// Solo lettura per ora (gestione in pannello admin WIP)
```

---

## 10. CAMPO REFERENCE — IMPLEMENTAZIONE LOOKUP

```typescript
// src/components/variabili/fields/ReferenceField.tsx

// ——— STRUTTURA VALORE ———
// { id: "65abc123...", label: "Mario Rossi" }
// Il label è lo `displayField` della Variabile (es: "nome" o "nome + cognome")

// ——— UX EDIT MODE ———
// 1. Campo testo con placeholder "Cerca [nomeAnagrafica]..."
// 2. Utente inizia a digitare
// 3. Dopo 300ms debounce: GET /api/anagrafiche/[targetSlug]/schede?q=[testo]&limit=8
// 4. Dropdown appare sotto il campo con risultati
// 5. Ogni risultato mostra: label del displayField
// 6. Click su risultato: seleziona, chiude dropdown, mostra il valore scelto
// 7. Valore scelto appare come pill/tag con X per rimuovere
//
// Ricerca vuota (campo aperto senza testo): mostra ultimi 5 risultati (recenti)

// ——— MULTI REFERENCE ———
// Identico ma:
// - Può avere più selezioni → array di {id, label}
// - Ogni selezione appare come pill con X
// - Dopo selezione, l'input rimane aperto per aggiungerne altri
// - Valore: Array<{id: string, label: string}>

// ——— IN VIEW MODE ———
// Mostra badge/link: "👤 Mario Rossi →"
// Click sul link: naviga a /anagrafica/[targetSlug]/[id]/view
```

---

## 11. CAMPO VARIANTID

```typescript
// src/components/variabili/fields/VariantIDField.tsx

// ——— CARICAMENTO ———
// GET /api/varianti?anagrafica=[slug]
// Se nessuna variante disponibile → campo non renderizzato

// ——— IN EDIT MODE ———
// Select dropdown con le varianti
// Opzione "Nessuna variante" come default
// Al cambio: emit onChange con nuovo variantID
// SchedaForm ascolta e aggiorna campiOsculti

// ——— IN VIEW MODE ———
// Badge colorato (colore.variante) con icona e nome variante
// Se nessuna variante: niente (non mostrare)

// ——— LOGICA OSCURAMENTO IN SCHEDAFORM ———
// Quando variantID cambia:
// 1. Trova la variante in lista varianti caricate
// 2. Aggiorna stato: campiOsculti = variante.variabiliOsculte
// 3. Il FieldRenderer riceve oscurato=true per questi campi → return null
// 4. Al submit, i campi oscurati NON sono inclusi nel payload (o sono null)
```

---

## 12. VALIDATORI ZOD CENTRALIZZATI

```typescript
// src/lib/validators.ts
import { z } from 'zod'
import { IVariabile, IVariante } from '@/types/variabili'

export function buildSchedaSchema(
  variabili: IVariabile[],
  variantID?: string,
  variante?: IVariante
): z.ZodSchema {

  const campiOsculti = variante?.variabiliOsculte || []
  const campiObbligatoriExtra = variante?.variabiliObbligatorie || []

  const shape: Record<string, z.ZodTypeAny> = {}

  for (const v of variabili) {
    const isOsculto = campiOsculti.includes(v.slug)
    const isObbligatorio = v.obbligatorio || campiObbligatoriExtra.includes(v.slug)

    // Se il campo è oscurato dalla variante, è sempre opzionale
    if (isOsculto) {
      shape[v.slug] = z.any().optional()
      continue
    }

    let schema: z.ZodTypeAny

    switch (v.tipo) {
      case 'text':
        schema = z.string().max(v.maxLength || 255)
        break
      case 'text-area':
        schema = z.string().max(5000)
        break
      case 'numbers':
        schema = z.number()
        if (v.min !== undefined) schema = (schema as z.ZodNumber).min(v.min)
        if (v.max !== undefined) schema = (schema as z.ZodNumber).max(v.max)
        break
      case 'mail':
        schema = z.string().email('Formato email non valido')
        break
      case 'phone':
        schema = z.string().regex(/^[0-9+\s\-(). ]+$/, 'Formato telefono non valido')
        break
      case 'data':
        schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)')
        break
      case 'select':
        schema = z.string()
        break
      case 'reference':
        schema = z.object({ id: z.string(), label: z.string() })
        break
      case 'multi-reference':
        schema = z.array(z.object({ id: z.string(), label: z.string() }))
        break
      case 'variantID':
        schema = z.string().optional()
        break
      default:
        schema = z.any()
    }

    shape[v.slug] = isObbligatorio ? schema : schema.optional()
  }

  return z.object(shape)
}
```
