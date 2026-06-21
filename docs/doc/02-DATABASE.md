# 🗄️ DOC-02 — DATABASE SCHEMA & ARCHITETTURA MONGODB
> **Leggi questo file per:** T-004, T-020, T-021, T-022, T-023, T-024, T-025, T-026, T-027
> **File chiave:** `src/models/*.ts`, `src/lib/mongodb*.ts`

---

## 1. ARCHITETTURA MULTI-CLUSTER

Il progetto usa cluster MongoDB separati per separare i domini di dati:

```
MONGODB_URI            → DB principale
  ├── users            (utenti e autenticazione)
  ├── anagrafiche_config (configurazione anagrafiche)
  ├── variabili        (definizione campi)
  ├── varianti         (varianti anagrafica)
  ├── select_options   (opzioni dropdown)
  └── notifiche        (notifiche in-app)

MONGODB_URI_ANAGRAFICHE → Cluster schede
  └── schede_{slug}    (es: schede_clienti, schede_fornitori)
      documenti        (metadati file caricati)

MONGODB_URI_EVENTI     → Cluster eventi
  └── eventi           (eventi calendario)

MONGODB_URI_AULE       → Cluster aule (uso futuro)
```

### Perché cluster separati?
- **Performance**: query anagrafiche non competono con query eventi
- **Scalabilità**: ogni cluster si scala indipendentemente
- **Isolamento**: un cluster in down non blocca gli altri

---

## 2. SCHEMA ANAGRAFICA CONFIG

```typescript
// src/models/AnagraficaConfig.ts
import mongoose, { Schema, Document } from 'mongoose'

export interface IAnagraficaConfig extends Document {
  slug: string           // URL-safe, es: "clienti", "fornitori"
  nome: string           // Nome visualizzato, es: "Clienti"
  descrizione?: string
  icona: string          // Nome icona Lucide, es: "Users"
  colore: string         // Hex color, es: "#4F46E5"
  variabili: string[]    // Array di slug variabili, in ordine di visualizzazione
  previewColumns: string[] // Slug variabili da mostrare nella lista preview
  tipiDocumento: string[]  // TODO (WIP admin): tipi documento accettati da questa anagrafica
  attiva: boolean
  ordine: number         // Ordine nella sidebar
  createdAt: Date
  updatedAt: Date
}

const AnagraficaConfigSchema = new Schema<IAnagraficaConfig>({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  nome: { type: String, required: true, trim: true },
  descrizione: { type: String },
  icona: { type: String, default: 'FileText' },
  colore: { type: String, default: '#6366F1' },
  variabili: [{ type: String }],          // slug variabili
  previewColumns: [{ type: String }],     // slug variabili per preview
  // NOTA: tipiDocumento sarà gestito dal Pannello Controllo > Documenti (WIP)
  tipiDocumento: [{ type: String }],
  attiva: { type: Boolean, default: true },
  ordine: { type: Number, default: 0 },
}, { timestamps: true })

AnagraficaConfigSchema.index({ attiva: 1, ordine: 1 })
```

---

## 3. SCHEMA VARIABILE (FIELD TYPE SYSTEM)

```typescript
// src/models/Variabile.ts
export type TipoVariabile =
  | 'text'
  | 'text-area'
  | 'numbers'
  | 'mail'
  | 'phone'
  | 'data'
  | 'select'
  | 'reference'
  | 'multi-reference'
  | 'variantID'

export interface IVariabile extends Document {
  slug: string             // Identificatore unico del campo, es: "email", "piva"
  label: string            // Label visualizzata, es: "Email", "P.IVA"
  tipo: TipoVariabile
  anagraficaSlug: string   // Anagrafica di appartenenza
  obbligatorio: boolean
  descrizione?: string     // Testo help sotto il campo
  placeholder?: string

  // ——— CONFIG PER TIPO: text ———
  maxLength?: number        // default 255

  // ——— CONFIG PER TIPO: numbers ———
  min?: number
  max?: number
  decimali?: boolean

  // ——— CONFIG PER TIPO: select ———
  // Le opzioni sono in SelectOption collection, filtrate per variabileSlug

  // ——— CONFIG PER TIPO: reference / multi-reference ———
  targetAnagrafica?: string // Slug anagrafica target
  displayField?: string     // Slug variabile da mostrare come label nel reference

  // ——— CONFIG PER TIPO: variantID ———
  // Nessuna config extra — le varianti sono in Variante collection

  // ——— DISPLAY ———
  ordine: number            // Ordine nel form
  visibileInPreview: boolean // Se mostrare in preview list (sovrascrive previewColumns)
}
```

---

## 4. SCHEMA VARIANTE

```typescript
// src/models/Variante.ts
export interface IVariante extends Document {
  nome: string              // Es: "Privato", "Azienda"
  slug: string              // Es: "privato", "azienda"
  anagraficaSlug: string    // Anagrafica di appartenenza
  variabiliOsculte: string[]   // Slug variabili NON visibili per questa variante
  variabiliObbligatorie: string[] // Slug variabili OBBLIGATORIE per questa variante (override)
  descrizione?: string
  colore: string            // Colore badge variante
  icona?: string
}

// Esempio dati:
// {
//   nome: "Privato",
//   slug: "privato",
//   anagraficaSlug: "clienti",
//   variabiliOsculte: ["piva"],  // Nasconde P.IVA per i privati
//   variabiliObbligatorie: ["codice_fiscale"],
//   colore: "#10B981"
// }
```

---

## 5. SCHEMA SCHEDA

```typescript
// src/models/Scheda.ts
export interface IScheda extends Document {
  anagraficaSlug: string
  variantID?: string        // Slug variante (opzionale)

  // I dati sono flessibili: chiave = slug variabile, valore = dato tipizzato
  // Esempio per anagrafica "clienti":
  // {
  //   nome: "Mario",
  //   cognome: "Rossi",
  //   email: "mario@example.com",
  //   tipo_cliente: "privato",
  //   variantID: "privato",
  //   cliente_ref: { id: "abc123", label: "Azienda Rossi SRL" }  // per reference
  // }
  dati: Record<string, any>

  attiva: boolean           // Soft delete
  createdBy: string         // userId
  updatedBy: string         // userId
  createdAt: Date
  updatedAt: Date
}

// ——— INDICI ———
// { anagraficaSlug: 1 }                    → query per anagrafica
// { anagraficaSlug: 1, variantID: 1 }      → filtro per variante
// { anagraficaSlug: 1, attiva: 1 }         → esclude soft-deleted
// { createdAt: -1 }                         → ordinamento cronologico

// ——— NOTE COLLECTION NAME ———
// La collection si chiama dinamicamente: "schede_{anagraficaSlug}"
// Usa mongoose.connection.collection(`schede_${anagraficaSlug}`) per query dirette
// O definisci il model con: mongoose.model('Scheda', schema, `schede_${slug}`)
```

---

## 6. SCHEMA DOCUMENTO

```typescript
// src/models/Documento.ts
// MIME types accettati
export const MIME_TYPES_ACCETTATI = ['image/jpeg', 'application/pdf', 'text/html'] as const
export type MimeTypeAccettato = typeof MIME_TYPES_ACCETTATI[number]

export interface IDocumento extends Document {
  schedaId: string          // _id della scheda di riferimento
  anagraficaSlug: string
  nomeFile: string          // Nome originale file
  tipoDocumento: string     // Es: "Contratto", "Fattura" — da lista WIP admin
  mimeType: MimeTypeAccettato
  dimensione: number        // Bytes
  r2Key: string             // Percorso su R2: {anagraficaSlug}/{schedaId}/{timestamp}-{nomeFile}
  r2Url?: string            // URL pubblico (se bucket pubblico) — preferire presigned
  caricatoDa: string        // userId
  caricatoAt: Date
  note?: string
}

// Index: { schedaId: 1 }
// Index: { anagraficaSlug: 1, schedaId: 1 }
```

---

## 7. SCHEMA EVENTO

```typescript
// src/models/Evento.ts
// ⚠️ QUESTO MODEL VA SUL CLUSTER MONGODB_URI_EVENTI
export interface IEvento extends Document {
  titolo: string
  descrizione?: string
  inizio: Date
  fine: Date
  tuttoIlGiorno: boolean
  colore: string            // Hex color, default primo colore palette eventi
  etichette: string[]       // Tag liberi, es: ["urgente", "cliente", "riunione"]
  collegamentoScheda?: string  // _id scheda (opzionale)
  collegamentoAnagrafica?: string // slug anagrafica (opzionale)
  createdBy: string         // userId
  partecipanti: string[]    // userId array
  createdAt: Date
  updatedAt: Date
}

// Index: { inizio: 1, fine: 1 }             → range query mese/giorno
// Index: { createdBy: 1, inizio: 1 }        → eventi per utente
// Index: { partecipanti: 1, inizio: 1 }     → eventi per partecipante
```

---

## 8. SCHEMA NOTIFICA

```typescript
// src/models/Notifica.ts
export type TipoNotifica = 'info' | 'success' | 'warning' | 'error'

export interface INotifica extends Document {
  userId: string            // Destinatario
  titolo: string
  messaggio: string
  tipo: TipoNotifica
  letta: boolean
  link?: string             // URL a cui navigare al click
  createdAt: Date
  // TTL: le notifiche scadono automaticamente dopo 30 giorni
}

// Index: { userId: 1, letta: 1 }
// Index TTL: { createdAt: 1 }, expireAfterSeconds: 2592000 (30 giorni)
```

---

## 9. SCHEMA SELECT OPTION

```typescript
// src/models/SelectOption.ts
export interface ISelectOption extends Document {
  variabileSlug: string     // Slug variabile di appartenenza
  anagraficaSlug: string    // Anagrafica di appartenenza
  label: string             // Testo mostrato all'utente
  valore: string            // Valore salvato nel db
  colore?: string           // Colore opzionale per badge
  ordine: number
  attiva: boolean
}

// Index: { variabileSlug: 1, anagraficaSlug: 1, attiva: 1, ordine: 1 }
```

---

## 10. INDICI DA CREARE SU MONGODB ATLAS

```javascript
// Esegui questi comandi su MongoDB Atlas > Collections > Indexes
// (O in uno script di migrazione)

// users
db.users.createIndex({ email: 1 }, { unique: true })

// anagrafiche_configs
db.anagrafiche_configs.createIndex({ slug: 1 }, { unique: true })
db.anagrafiche_configs.createIndex({ attiva: 1, ordine: 1 })

// variabilis
db.variabilis.createIndex({ slug: 1, anagraficaSlug: 1 }, { unique: true })

// variantes
db.variantes.createIndex({ slug: 1, anagraficaSlug: 1 }, { unique: true })

// schede_{slug} (per ogni anagrafica)
db.schede_clienti.createIndex({ attiva: 1, createdAt: -1 })
db.schede_clienti.createIndex({ variantID: 1, attiva: 1 })

// documenti
db.documenti.createIndex({ schedaId: 1 })
db.documenti.createIndex({ anagraficaSlug: 1, schedaId: 1 })

// eventi (su cluster EVENTI)
db.eventi.createIndex({ inizio: 1, fine: 1 })
db.eventi.createIndex({ createdBy: 1, inizio: 1 })

// notifiche
db.notifiche.createIndex({ userId: 1, letta: 1 })
db.notifiche.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 })

// select_options
db.select_options.createIndex({ variabileSlug: 1, anagraficaSlug: 1, attiva: 1 })
```
