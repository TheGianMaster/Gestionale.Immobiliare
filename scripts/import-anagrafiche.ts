/**
 * scripts/import-anagrafiche.ts
 * Importa le anagrafiche definite in questo file (9 originarie dall'Excel + 'trasferimenti'
 * aggiunta per il modulo Bilancio, T-113) nelle rispettive config del gestionale.
 *
 * USO: npm run import:anagrafiche
 * Opzioni:
 *   --preview        solo stampa senza salvare
 *   --elimina-extra  elimina le anagrafiche nel DB non presenti in questo file
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import mongoose, { Schema } from 'mongoose'

const ok   = (msg: string) => console.log(`  ✓ ${msg}`)
const log  = (msg: string) => console.log(`  · ${msg}`)
const warn = (msg: string) => console.log(`  ⚠ ${msg}`)

const PREVIEW        = process.argv.includes('--preview')
const ELIMINA_EXTRA  = process.argv.includes('--elimina-extra')

// ── Tipi ─────────────────────────────────────────────────────────────────────

interface ColonnaLineItems {
  slug: string; nome: string; tipo: 'text' | 'numbers' | 'reference'
  referenceTo?: string; decimali?: boolean; placeholder?: string
}

interface VariabileInput {
  slug: string; nome: string
  tipo: string
  obbligatorio?: boolean
  descrizione?: string
  placeholder?: string
  decimali?: boolean
  referenceTo?: string
  colonne?: ColonnaLineItems[]
  options?: string[]     // per select: opzioni predefinite
  visibileInPreview?: boolean
  ordine: number
}

interface AnagraficaInput {
  slug: string; nome: string
  icona?: string; colore?: string
  ordine: number
  previewColumns?: string[]
  variabili: VariabileInput[]
}

// ── Definizione delle 9 anagrafiche ──────────────────────────────────────────

const ANAGRAFICHE: AnagraficaInput[] = [
  // 1. PORTAFOGLI
  {
    slug: 'portafogli', nome: 'Portafogli', icona: 'Wallet', colore: '#6366F1', ordine: 1,
    previewColumns: ['titolo'],
    variabili: [
      { slug: 'titolo',           nome: 'Titolo',            tipo: 'text',      obbligatorio: true,  visibileInPreview: true, ordine: 0 },
      { slug: 'sottotitolo',      nome: 'Sottotitolo',       tipo: 'text',      obbligatorio: false, ordine: 1 },
      { slug: 'descrizione',      nome: 'Descrizione',       tipo: 'text-area', obbligatorio: false, ordine: 2 },
      { slug: 'debito_associato', nome: 'Debito associato',  tipo: 'reference', obbligatorio: false, ordine: 3, referenceTo: 'debiti' },
      { slug: 'data_apertura',    nome: 'Data apertura',     tipo: 'data',      obbligatorio: false, ordine: 4 },
      { slug: 'data_chiusura',    nome: 'Data chiusura',     tipo: 'data',      obbligatorio: false, ordine: 5 },
      { slug: 'fondi_disponibili',nome: 'Fondi disponibili', tipo: 'numbers',   obbligatorio: false, ordine: 6, decimali: true },
    ],
  },

  // 2. RUBRICA
  {
    slug: 'rubrica', nome: 'Rubrica', icona: 'BookUser', colore: '#0EA5E9', ordine: 2,
    previewColumns: ['riferimento', 'cognome', 'nome'],
    variabili: [
      { slug: 'riferimento',   nome: 'Riferimento',   tipo: 'text',  obbligatorio: true,  visibileInPreview: true,  ordine: 0 },
      { slug: 'cognome',       nome: 'Cognome',       tipo: 'text',  obbligatorio: false, visibileInPreview: true,  ordine: 1 },
      { slug: 'nome',          nome: 'Nome',          tipo: 'text',  obbligatorio: false, visibileInPreview: false, ordine: 2 },
      { slug: 'tipo_contatto', nome: 'Tipo di contatto', tipo: 'select', obbligatorio: false, visibileInPreview: false, ordine: 3,
        options: ['agenzia immobiliare', 'banca', 'ditta', 'professionista', 'contatto', 'vicino'] },
      { slug: 'indirizzo_sede', nome: 'Indirizzo sede', tipo: 'text', obbligatorio: false, ordine: 4 },
      { slug: 'tipo_contatto_geopoint', nome: 'Geopoint indirizzo', tipo: 'text', obbligatorio: false, ordine: 5,
        descrizione: 'Coordinate o link mappa per l\'indirizzo' },
      { slug: 'telefono',      nome: 'Telefono',      tipo: 'phone', obbligatorio: false, ordine: 6 },
      { slug: 'mail',          nome: 'Mail',          tipo: 'mail',  obbligatorio: false, ordine: 7 },
      { slug: 'descrizione',   nome: 'Descrizione',   tipo: 'text-area', obbligatorio: false, ordine: 8 },
    ],
  },

  // 3. CASE
  {
    slug: 'case', nome: 'Case', icona: 'Home', colore: '#10B981', ordine: 3,
    previewColumns: ['via'],
    variabili: [
      { slug: 'via',                nome: 'Via',                    tipo: 'text',           obbligatorio: true,  visibileInPreview: true,  ordine: 0 },
      { slug: 'mq',                 nome: 'Mq',                     tipo: 'numbers',        obbligatorio: false, visibileInPreview: true,  ordine: 1, decimali: false },
      { slug: 'prezzo_acquisto',    nome: 'Prezzo di acquisto',     tipo: 'numbers',        obbligatorio: false, ordine: 2,  decimali: true },
      { slug: 'quota_agenzia',      nome: 'Quota agenzia',         tipo: 'numbers',        obbligatorio: false, ordine: 3,  decimali: true },
      { slug: 'agenzia',            nome: 'Agenzia',                tipo: 'reference',      obbligatorio: false, ordine: 4,  referenceTo: 'rubrica' },
      { slug: 'notaio',             nome: 'Notaio',                 tipo: 'reference',      obbligatorio: false, ordine: 5,  referenceTo: 'rubrica' },
      { slug: 'vecchi_proprietari', nome: 'Vecchi proprietari',     tipo: 'multi-reference',obbligatorio: false, ordine: 6,  referenceTo: 'rubrica' },
      { slug: 'costo_atto_notarile',nome: 'Costo atto notarile',   tipo: 'numbers',        obbligatorio: false, ordine: 7,  decimali: true },
      { slug: 'imposte_pagate',     nome: 'Imposte pagate',        tipo: 'numbers',        obbligatorio: false, ordine: 8,  decimali: true },
      { slug: 'rendita_catastale',  nome: 'Rendita catastale',     tipo: 'numbers',        obbligatorio: false, ordine: 9,  decimali: true },
      { slug: 'valore_catastale',   nome: 'Valore catastale',      tipo: 'numbers',        obbligatorio: false, ordine: 10, decimali: true },
      { slug: 'imu_annuale',        nome: 'IMU annuale',            tipo: 'numbers',        obbligatorio: false, ordine: 11, decimali: true },
      { slug: 'data_rogito',        nome: 'Data rogito',            tipo: 'data',           obbligatorio: false, ordine: 12 },
      { slug: 'affittuari',         nome: 'Affittuari',             tipo: 'multi-reference',obbligatorio: false, ordine: 13, referenceTo: 'affittuari' },
      { slug: 'garage_affittato_a', nome: 'Garage affittato a',    tipo: 'reference',      obbligatorio: false, ordine: 14, referenceTo: 'affittuari' },
    ],
  },

  // 4. AFFITTUARI
  {
    slug: 'affittuari', nome: 'Affittuari', icona: 'Users', colore: '#F59E0B', ordine: 4,
    previewColumns: ['nome', 'cognome'],
    variabili: [
      { slug: 'nome',            nome: 'Nome',             tipo: 'text',           obbligatorio: true,  visibileInPreview: true,  ordine: 0 },
      { slug: 'cognome',         nome: 'Cognome',          tipo: 'text',           obbligatorio: true,  visibileInPreview: true,  ordine: 1 },
      { slug: 'cellulare',       nome: 'Cellulare',        tipo: 'phone',          obbligatorio: false, ordine: 2 },
      { slug: 'mail',            nome: 'Mail',             tipo: 'mail',           obbligatorio: false, ordine: 3 },
      { slug: 'garanti',         nome: 'Garanti',          tipo: 'multi-reference',obbligatorio: false, ordine: 4, referenceTo: 'rubrica' },
      { slug: 'data_nascita',    nome: 'Data di nascita',  tipo: 'data',           obbligatorio: false, ordine: 5 },
      { slug: 'luogo_nascita',   nome: 'Luogo di nascita', tipo: 'text',           obbligatorio: false, ordine: 6 },
      { slug: 'codice_fiscale',  nome: 'Codice fiscale',   tipo: 'text',           obbligatorio: false, ordine: 7 },
      { slug: 'entrato_il',      nome: 'Entrato il',       tipo: 'data',           obbligatorio: false, ordine: 8 },
      { slug: 'uscita_prevista', nome: 'Uscita prevista',  tipo: 'data',           obbligatorio: false, ordine: 9 },
      { slug: 'caparra_versata', nome: 'Caparra versata',  tipo: 'numbers',        obbligatorio: false, ordine: 10, decimali: true },
      { slug: 'contratto',       nome: 'Contratto',        tipo: 'multi-reference',obbligatorio: false, ordine: 11, referenceTo: 'contratti' },
      { slug: 'note',            nome: 'Note',             tipo: 'text-area',      obbligatorio: false, ordine: 12 },
    ],
  },

  // 5. CONTRATTI
  {
    slug: 'contratti', nome: 'Contratti', icona: 'FileSignature', colore: '#8B5CF6', ordine: 5,
    previewColumns: ['casa'],
    variabili: [
      { slug: 'casa',                        nome: 'Casa',                              tipo: 'reference',      obbligatorio: true,  visibileInPreview: true, ordine: 0, referenceTo: 'case' },
      { slug: 'data_stipulazione',           nome: 'Data stipulazione',                 tipo: 'data',           obbligatorio: false, ordine: 1 },
      { slug: 'tipo_contratto',              nome: 'Tipo di contratto',                 tipo: 'select',         obbligatorio: false, ordine: 2,
        options: ['transitorio', 'altro'] },
      { slug: 'scadenza',                    nome: 'Scadenza',                          tipo: 'data',           obbligatorio: false, ordine: 3 },
      { slug: 'canone_mensile',              nome: 'Canone mensile',                    tipo: 'numbers',        obbligatorio: false, ordine: 4, decimali: true },
      { slug: 'canone_mensile_pulizie',      nome: 'Canone mensile pulizie',            tipo: 'numbers',        obbligatorio: false, ordine: 5, decimali: true },
      { slug: 'canone_mensile_utenze',       nome: 'Canone mensile utenze (conguaglio)',tipo: 'numbers',        obbligatorio: false, ordine: 6, decimali: true },
      { slug: 'affittuari',                  nome: 'Affittuari',                        tipo: 'multi-reference',obbligatorio: false, ordine: 7, referenceTo: 'affittuari' },
      { slug: 'cedolare_secca',              nome: 'Cedolare secca',                    tipo: 'numbers',        obbligatorio: false, ordine: 8, decimali: true },
    ],
  },

  // 6. SPESE
  {
    slug: 'spese', nome: 'Spese', icona: 'TrendingDown', colore: '#EF4444', ordine: 6,
    previewColumns: ['titolo'],
    variabili: [
      { slug: 'titolo',          nome: 'Titolo',          tipo: 'text',           obbligatorio: true,  visibileInPreview: true, ordine: 0 },
      { slug: 'importo_totale',  nome: 'Importo totale',  tipo: 'numbers',        obbligatorio: false, ordine: 1, decimali: true },
      {
        slug: 'fondi_provenienza', nome: 'Fondi di provenienza', tipo: 'line-items',
        obbligatorio: false, ordine: 2,
        descrizione: 'Aggiungi una riga per ogni fondo con il relativo importo',
        colonne: [
          { slug: 'fondo',   nome: 'Fondo',   tipo: 'reference', referenceTo: 'portafogli' },
          { slug: 'importo', nome: 'Importo', tipo: 'numbers',   decimali: true },
        ],
      },
      { slug: 'casa',            nome: 'Casa',            tipo: 'reference',      obbligatorio: false, ordine: 3, referenceTo: 'case' },
      { slug: 'descrizione',     nome: 'Descrizione',     tipo: 'text-area',      obbligatorio: false, ordine: 4 },
      { slug: 'stato_spesa',     nome: 'Stato spesa',     tipo: 'select',         obbligatorio: false, ordine: 5,
        options: ['prevista', 'ipotizzata', 'pagata', 'annullata'] },
      { slug: 'fornitore',       nome: 'Fornitore',       tipo: 'reference',      obbligatorio: false, ordine: 6, referenceTo: 'rubrica' },
      { slug: 'tipo_spesa',      nome: 'Tipo di spesa',   tipo: 'select',         obbligatorio: false, ordine: 7,
        options: ['acquisto immobile', 'mobili', 'lavori', 'permessi e certificazioni', 'lavoretti interni', 'riparazioni', 'assicurazione', 'altro'] },
      { slug: 'abbattimento_debito', nome: 'Abbattimento debito', tipo: 'reference', obbligatorio: false, ordine: 8, referenceTo: 'debiti' },
      { slug: 'aumento_debito',      nome: 'Aumento debito',      tipo: 'reference', obbligatorio: false, ordine: 9, referenceTo: 'debiti' },
      { slug: 'data',            nome: 'Data',            tipo: 'data',           obbligatorio: false, ordine: 10 },
    ],
  },

  // 7. RICAVI
  {
    slug: 'ricavi', nome: 'Ricavi', icona: 'TrendingUp', colore: '#22C55E', ordine: 7,
    previewColumns: ['titolo'],
    variabili: [
      { slug: 'titolo',          nome: 'Titolo',          tipo: 'text',           obbligatorio: true,  visibileInPreview: true, ordine: 0 },
      { slug: 'importo_totale',  nome: 'Importo totale',  tipo: 'numbers',        obbligatorio: false, ordine: 1, decimali: true },
      {
        slug: 'fondi_destinazione', nome: 'Fondi di destinazione', tipo: 'line-items',
        obbligatorio: false, ordine: 2,
        descrizione: 'Aggiungi una riga per ogni fondo con il relativo importo',
        colonne: [
          { slug: 'fondo',   nome: 'Fondo',   tipo: 'reference', referenceTo: 'portafogli' },
          { slug: 'importo', nome: 'Importo', tipo: 'numbers',   decimali: true },
        ],
      },
      { slug: 'casa',            nome: 'Casa',            tipo: 'reference',      obbligatorio: false, ordine: 3, referenceTo: 'case' },
      { slug: 'descrizione',     nome: 'Descrizione',     tipo: 'text-area',      obbligatorio: false, ordine: 4 },
      { slug: 'stato_ricavo',    nome: 'Stato ricavo',    tipo: 'select',         obbligatorio: false, ordine: 5,
        options: ['simulata', 'prevista', 'incassata', 'annullata'] },
      { slug: 'affittuario',     nome: 'Affittuario',     tipo: 'reference',      obbligatorio: false, ordine: 6, referenceTo: 'affittuari' },
      { slug: 'tipo_ricavo',     nome: 'Tipo di ricavo',  tipo: 'select',         obbligatorio: false, ordine: 7,
        options: ['affitto camera', 'affitto garage', 'vendita immobile', 'debito'] },
      { slug: 'data',            nome: 'Data',            tipo: 'data',           obbligatorio: false, ordine: 8 },
      { slug: 'crediti',         nome: 'Crediti',         tipo: 'reference',      obbligatorio: false, ordine: 9, referenceTo: 'crediti' },
    ],
  },

  // 8. DEBITI
  {
    slug: 'debiti', nome: 'Debiti', icona: 'ArrowDownCircle', colore: '#DC2626', ordine: 8,
    previewColumns: ['titolo'],
    variabili: [
      { slug: 'titolo',             nome: 'Titolo',               tipo: 'text',      obbligatorio: true,  visibileInPreview: true, ordine: 0 },
      { slug: 'referente',          nome: 'Referente',            tipo: 'reference', obbligatorio: false, ordine: 1, referenceTo: 'rubrica' },
      { slug: 'tipo_debito',        nome: 'Tipo di debito',       tipo: 'select',    obbligatorio: false, ordine: 2,
        options: ['mutuo', 'prestito', 'finanziamento', 'infruttifero', 'altro'] },
      { slug: 'tipo_tasso',         nome: 'Tipo tasso interesse', tipo: 'select',    obbligatorio: false, ordine: 3,
        options: ['alla francese', 'altro'] },
      { slug: 'totale_addebitato',  nome: 'Totale addebitato',    tipo: 'numbers',   obbligatorio: false, ordine: 4,  decimali: true },
      { slug: 'tasso_interesse',    nome: 'Tasso interesse',      tipo: 'numbers',   obbligatorio: false, ordine: 5,  decimali: true },
      { slug: 'rata_mensile',       nome: 'Rata mensile',         tipo: 'numbers',   obbligatorio: false, ordine: 6,  decimali: true },
      { slug: 'importo_erogato',    nome: 'Importo erogato',      tipo: 'numbers',   obbligatorio: false, ordine: 7,  decimali: true },
      { slug: 'data_apertura',      nome: 'Data apertura debito', tipo: 'data',      obbligatorio: false, ordine: 8 },
      { slug: 'scadenza_prevista',  nome: 'Scadenza prevista',    tipo: 'data',      obbligatorio: false, ordine: 9 },
      { slug: 'totale_restituito',  nome: 'Totale restituito',    tipo: 'numbers',   obbligatorio: false, ordine: 10, decimali: true },
      { slug: 'note',               nome: 'Note',                 tipo: 'text-area', obbligatorio: false, ordine: 11 },
    ],
  },

  // 9. CREDITI
  {
    slug: 'crediti', nome: 'Crediti', icona: 'ArrowUpCircle', colore: '#16A34A', ordine: 9,
    previewColumns: ['titolo'],
    variabili: [
      { slug: 'titolo', nome: 'Titolo', tipo: 'text', obbligatorio: true, visibileInPreview: true, ordine: 0 },
    ],
  },

  // 10. TRASFERIMENTI (Bilancio — T-112/T-113, vedi docs/12-BILANCIO.md §6.2)
  {
    slug: 'trasferimenti', nome: 'Trasferimenti', icona: 'ArrowLeftRight', colore: '#3B82F6', ordine: 10,
    previewColumns: ['titolo'],
    variabili: [
      { slug: 'titolo',              nome: 'Titolo',               tipo: 'text',      obbligatorio: true,  visibileInPreview: true, ordine: 0,
        descrizione: 'Generato automaticamente da "Sposta fondi" (es. "Portafoglio A → Portafoglio B, C")' },
      { slug: 'portafoglio_origine', nome: 'Portafoglio di origine', tipo: 'reference', obbligatorio: true, ordine: 1, referenceTo: 'portafogli' },
      {
        slug: 'destinazioni', nome: 'Destinazioni', tipo: 'line-items',
        obbligatorio: true, ordine: 2,
        descrizione: 'Aggiungi una riga per ogni portafoglio di destinazione con il relativo importo',
        colonne: [
          { slug: 'portafoglio', nome: 'Portafoglio', tipo: 'reference', referenceTo: 'portafogli' },
          { slug: 'importo',     nome: 'Importo',     tipo: 'numbers',   decimali: true },
        ],
      },
      { slug: 'importo_totale',      nome: 'Importo totale',        tipo: 'numbers',   obbligatorio: true,  ordine: 3, decimali: true,
        descrizione: 'Deve coincidere con la somma degli importi in "Destinazioni" (validato lato API in T-115)' },
      { slug: 'data',                 nome: 'Data',                  tipo: 'data',       obbligatorio: true,  ordine: 4 },
      { slug: 'note',                 nome: 'Note',                  tipo: 'text-area',  obbligatorio: false, ordine: 5 },
    ],
  },
]

// ── Connessione ───────────────────────────────────────────────────────────────

async function connectMain() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI non trovata in .env.local')
  const db = process.env.MONGODB_DB ?? 'gestionale'
  const conn = await mongoose.createConnection(uri, { dbName: db }).asPromise()
  ok(`DB principale connesso (${db})`)
  return conn
}

// ── Schemi inline ─────────────────────────────────────────────────────────────

function buildModels(conn: mongoose.Connection) {
  const ColonnaSchema = new Schema({
    slug: String, nome: String, tipo: String, referenceTo: String,
    decimali: Boolean, placeholder: String,
  }, { _id: false })

  const VariabileSchema = new Schema({
    slug: String, nome: String, tipo: String, anagraficaSlug: String,
    obbligatorio: { type: Boolean, default: false },
    descrizione: String, placeholder: String,
    decimali: { type: Boolean, default: false },
    referenceTo: String,
    colonne: [ColonnaSchema],
    ordine: { type: Number, default: 0 },
    visibileInPreview: { type: Boolean, default: false },
  }, { timestamps: true })

  const AnagraficaConfigSchema = new Schema({
    slug: String, nome: String, descrizione: String,
    icona: { type: String, default: 'FileText' },
    colore: { type: String, default: '#6366F1' },
    variabili: [String],
    previewColumns: [String],
    varianti: [],
    tipiDocumento: [String],
    maxDocumentoMB: { type: Number, default: 10 },
    attiva: { type: Boolean, default: true },
    ordine: { type: Number, default: 0 },
  }, { timestamps: true })

  const SelectOptionSchema = new Schema({
    anagraficaSlug: String, variabileSlug: String,
    valore: String, etichetta: String, ordine: Number, attiva: Boolean,
  }, { timestamps: true })

  const Variabile = conn.models['Variabile']
    ?? conn.model('Variabile', VariabileSchema)
  const AnagraficaConfig = conn.models['AnagraficaConfig']
    ?? conn.model('AnagraficaConfig', AnagraficaConfigSchema)
  const SelectOption = conn.models['SelectOption']
    ?? conn.model('SelectOption', SelectOptionSchema)

  return { Variabile, AnagraficaConfig, SelectOption }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (PREVIEW) {
    console.log('\n=== PREVIEW (nessuna modifica al DB) ===\n')
  }

  const conn = await connectMain()
  const { Variabile, AnagraficaConfig, SelectOption } = buildModels(conn)

  // Ottieni slug esistenti
  const esistenti = await AnagraficaConfig.find({}, { slug: 1 }).lean() as unknown as { slug: string }[]
  const slugEsistenti = new Set(esistenti.map(e => e.slug))
  const slugNuovi     = new Set(ANAGRAFICHE.map(a => a.slug))

  // ELIMINA EXTRA
  if (ELIMINA_EXTRA) {
    for (const slug of slugEsistenti) {
      if (!slugNuovi.has(slug)) {
        warn(`Elimino anagrafica extra: ${slug}`)
        if (!PREVIEW) {
          await AnagraficaConfig.deleteOne({ slug })
          await Variabile.deleteMany({ anagraficaSlug: slug })
          await SelectOption.deleteMany({ anagraficaSlug: slug })
        }
      }
    }
  }

  // CREA / AGGIORNA
  for (const a of ANAGRAFICHE) {
    console.log(`\n  · ${a.slug.toUpperCase()} (${a.variabili.length} variabili)`)

    if (PREVIEW) {
      for (const v of a.variabili) {
        log(`    ${v.slug} [${v.tipo}]${v.colonne ? ` (${v.colonne.length} colonne)` : ''}`)
      }
      continue
    }

    // Crea o aggiorna AnagraficaConfig
    const variabiliSlugs = a.variabili.map(v => v.slug)
    await AnagraficaConfig.findOneAndUpdate(
      { slug: a.slug },
      {
        $set: {
          nome:           a.nome,
          icona:          a.icona ?? 'FileText',
          colore:         a.colore ?? '#6366F1',
          variabili:      variabiliSlugs,
          previewColumns: a.previewColumns ?? [a.variabili[0]?.slug ?? 'nome'],
          ordine:         a.ordine,
          attiva:         true,
        },
      },
      { upsert: true, new: true }
    )
    ok(`  AnagraficaConfig: ${a.slug}`)

    // Elimina variabili precedenti
    await Variabile.deleteMany({ anagraficaSlug: a.slug })
    await SelectOption.deleteMany({ anagraficaSlug: a.slug })

    // Crea le variabili
    for (const v of a.variabili) {
      const doc: Record<string, unknown> = {
        slug:              v.slug,
        nome:              v.nome,
        tipo:              v.tipo,
        anagraficaSlug:    a.slug,
        obbligatorio:      v.obbligatorio ?? false,
        ordine:            v.ordine,
        visibileInPreview: v.visibileInPreview ?? false,
      }
      if (v.descrizione)   doc.descrizione   = v.descrizione
      if (v.placeholder)   doc.placeholder   = v.placeholder
      if (v.decimali)      doc.decimali       = v.decimali
      if (v.referenceTo)   doc.referenceTo    = v.referenceTo
      if (v.colonne)       doc.colonne        = v.colonne

      await Variabile.create(doc)

      // Select options
      if (v.options?.length) {
        for (let i = 0; i < v.options.length; i++) {
          await SelectOption.create({
            anagraficaSlug: a.slug,
            variabileSlug:  v.slug,
            valore:         v.options[i],
            etichetta:      v.options[i],
            ordine:         i,
            attiva:         true,
          })
        }
      }
    }
    ok(`  ${a.variabili.length} variabili create`)
  }

  await conn.close()
  console.log('\n✅  Import completato.\n')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
