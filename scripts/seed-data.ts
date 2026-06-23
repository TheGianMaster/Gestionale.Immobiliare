/**
 * scripts/seed-data.ts
 * Seed dati di sviluppo: 3 anagrafiche di prova con tutte le tipologie di campo + 3 schede ciascuna.
 *
 * Uso: npm run seed:data
 * Idempotente: cancella e ricrea solo i documenti con slug *-prova.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import mongoose, { Schema } from 'mongoose'

// ——— UTILITY ———
const ok  = (msg: string) => process.stdout.write(`  ✓ ${msg}\n`)
const err = (msg: string) => process.stdout.write(`  ✗ ${msg}\n`)

// ——— CONNESSIONE UNICA ———
async function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI non trovata in .env.local')
  const db  = process.env.MONGODB_DB ?? 'gestionale'
  await mongoose.connect(uri, { dbName: db })
  ok(`MongoDB connesso (db: ${db})`)
}

// ——— MODELLI INLINE ———
function getModels() {
  const varianteConfigSchema = new Schema(
    { id: String, nome: String, descrizione: String },
    { _id: false }
  )

  const AnagraficaConfig = mongoose.models.AnagraficaConfig ?? mongoose.model('AnagraficaConfig', new Schema({
    slug: String, nome: String, icona: String, colore: String,
    variabili: [String], previewColumns: [String],
    varianti: [varianteConfigSchema],
    tipiDocumento: [String], attiva: Boolean, ordine: Number,
  }, { timestamps: true }))

  const Variabile = mongoose.models.Variabile ?? mongoose.model('Variabile', new Schema({
    slug: String, nome: String, tipo: String, anagraficaSlug: String,
    obbligatorio: Boolean, placeholder: String,
    maxLength: Number, min: Number, max: Number, decimali: Boolean,
    referenceTo: String, soloPerVarianti: [String],
    ordine: Number, visibileInPreview: Boolean,
  }, { timestamps: true }))

  const SelectOption = mongoose.models.SelectOption ?? mongoose.model('SelectOption', new Schema({
    anagraficaSlug: String, variabileSlug: String,
    valore: String, etichetta: String, colore: String,
    ordine: Number, attiva: Boolean,
  }, { timestamps: true }))

  return { AnagraficaConfig, Variabile, SelectOption }
}

function getSchedaModel(slug: string) {
  const name = `schede_${slug}`
  if (mongoose.models[name]) return mongoose.models[name]
  return mongoose.model(name, new Schema({
    anagraficaSlug: String, dati: Schema.Types.Mixed,
    attiva: Boolean, versione: Number,
    creataDa: Schema.Types.ObjectId, modificataDa: Schema.Types.ObjectId,
    tags: [String],
  }, { timestamps: true, collection: name }))
}

// ——— DEFINIZIONI ANAGRAFICHE ———
interface AnagraficaDef {
  slug:    string
  nome:    string
  icona:   string
  colore:  string
  ordine:  number
  varianti: Array<{ id: string; nome: string }>
  refTo:   string
  mrefTo:  string
  nomi:    string[]
}

const ANAGRAFICHE: AnagraficaDef[] = [
  {
    slug: 'tecnici-prova', nome: 'Tecnici Prova', icona: 'Wrench', colore: '#10B981', ordine: 10,
    varianti: [{ id: 'senior', nome: 'Senior' }, { id: 'junior', nome: 'Junior' }],
    refTo: 'commerciali-prova', mrefTo: 'commerciali-prova',
    nomi: ['tecnico prova 1', 'tecnico prova 2', 'tecnico prova 3'],
  },
  {
    slug: 'commerciali-prova', nome: 'Commerciali Prova', icona: 'Briefcase', colore: '#F59E0B', ordine: 11,
    varianti: [{ id: 'area_nord', nome: 'Area Nord' }, { id: 'area_sud', nome: 'Area Sud' }],
    refTo: 'tecnici-prova', mrefTo: 'tecnici-prova',
    nomi: ['commerciale prova 1', 'commerciale prova 2', 'commerciale prova 3'],
  },
  {
    slug: 'clienti-prova', nome: 'Clienti Prova', icona: 'Users', colore: '#6366F1', ordine: 12,
    varianti: [{ id: 'standard', nome: 'Standard' }, { id: 'premium', nome: 'Premium' }],
    refTo: 'tecnici-prova', mrefTo: 'commerciali-prova',
    nomi: ['cliente prova 1', 'cliente prova 2', 'cliente prova 3'],
  },
]

const SAMPLE = {
  note:      ['Note di prova per la prima scheda.', 'Questa e la seconda scheda di prova.', 'Terza scheda con note aggiuntive.'],
  numero:    [28, 45, 33],
  email:     ['prova1@esempio.it', 'prova2@esempio.it', 'prova3@esempio.it'],
  telefono:  ['+39 02 1234567', '+39 06 9876543', '+39 011 5551234'],
  data:      ['1990-03-15', '1985-07-22', '1978-11-08'],
  categoria: ['cat_a', 'cat_b', 'cat_a'],
  varIdx:    [0, 1, 0],
  tags:      [['test', 'prova'], ['prova', 'demo'], ['test', 'demo']],
}

const SELECT_OPZIONI = [
  { valore: 'cat_a', etichetta: 'Categoria A', colore: '#6366F1', ordine: 0 },
  { valore: 'cat_b', etichetta: 'Categoria B', colore: '#10B981', ordine: 1 },
  { valore: 'cat_c', etichetta: 'Categoria C', colore: '#F59E0B', ordine: 2 },
]

const VAR_DEFS = (anaSlug: string, refTo: string, mrefTo: string) => [
  { slug: 'titolo',          nome: 'Titolo',          tipo: 'text',           obbligatorio: true,  visibileInPreview: true,  ordine: 0 },
  { slug: 'note',            nome: 'Note',            tipo: 'text-area',      obbligatorio: false, visibileInPreview: false, ordine: 1, maxLength: 1000 },
  { slug: 'numero',          nome: 'Numero',          tipo: 'numbers',        obbligatorio: false, visibileInPreview: true,  ordine: 2, min: 0, max: 999, decimali: false },
  { slug: 'email',           nome: 'Email',           tipo: 'mail',           obbligatorio: false, visibileInPreview: true,  ordine: 3 },
  { slug: 'telefono',        nome: 'Telefono',        tipo: 'phone',          obbligatorio: false, visibileInPreview: false, ordine: 4 },
  { slug: 'data',            nome: 'Data',            tipo: 'data',           obbligatorio: false, visibileInPreview: false, ordine: 5 },
  { slug: 'categoria',       nome: 'Categoria',       tipo: 'select',         obbligatorio: false, visibileInPreview: true,  ordine: 6 },
  { slug: 'collegato_a',     nome: 'Collegato a',     tipo: 'reference',      obbligatorio: false, visibileInPreview: false, ordine: 7, referenceTo: refTo },
  { slug: 'altri_collegati', nome: 'Altri collegati', tipo: 'multi-reference',obbligatorio: false, visibileInPreview: false, ordine: 8, referenceTo: mrefTo },
  { slug: 'tipo',            nome: 'Tipo',            tipo: 'variantID',      obbligatorio: false, visibileInPreview: true,  ordine: 9 },
].map(v => ({ ...v, anagraficaSlug: anaSlug }))

const VAR_SLUGS = ['titolo','note','numero','email','telefono','data','categoria','collegato_a','altri_collegati','tipo']

// ——— MAIN ———
async function main() {
  process.stdout.write('\n Seed dati di sviluppo\n\n')
  await connect()

  const { AnagraficaConfig, Variabile, SelectOption } = getModels()
  const slugsProva = ANAGRAFICHE.map(a => a.slug)
  const SYSTEM_ID  = new mongoose.Types.ObjectId('000000000000000000000001')

  // ——— 1. Pulizia ———
  process.stdout.write('[1/4] Pulizia dati precedenti...\n')
  await AnagraficaConfig.deleteMany({ slug: { $in: slugsProva } })
  await Variabile.deleteMany({ anagraficaSlug: { $in: slugsProva } })
  await SelectOption.deleteMany({ anagraficaSlug: { $in: slugsProva } })
  for (const slug of slugsProva) {
    await getSchedaModel(slug).deleteMany({})
  }
  ok('Dati precedenti rimossi')

  // ——— 2. Config + Variabili + SelectOptions ———
  process.stdout.write('\n[2/4] Creazione config e variabili...\n')
  for (const ana of ANAGRAFICHE) {
    await Variabile.insertMany(VAR_DEFS(ana.slug, ana.refTo, ana.mrefTo))
    await SelectOption.insertMany(SELECT_OPZIONI.map(o => ({ ...o, anagraficaSlug: ana.slug, variabileSlug: 'categoria', attiva: true })))
    await AnagraficaConfig.create({
      slug: ana.slug, nome: ana.nome, icona: ana.icona, colore: ana.colore,
      ordine: ana.ordine, attiva: true,
      variabili: VAR_SLUGS, previewColumns: ['titolo','numero','email','categoria','tipo'],
      varianti: ana.varianti, tipiDocumento: [],
    })
    ok(`${ana.nome}: config + variabili + select options`)
  }

  // ——— 3. Schede (tecnici → commerciali → clienti) ———
  process.stdout.write('\n[3/4] Creazione schede...\n')
  const schedeRef: Record<string, Array<{ id: string; label: string }>> = {}

  for (const ana of ANAGRAFICHE) {
    const Scheda  = getSchedaModel(ana.slug)
    const created: Array<{ id: string; label: string }> = []

    for (let i = 0; i < 3; i++) {
      const varianteId = ana.varianti[SAMPLE.varIdx[i]].id
      const refTarget  = schedeRef[ana.refTo]
      const mrefTarget = schedeRef[ana.mrefTo]

      const scheda = await Scheda.create({
        anagraficaSlug: ana.slug, attiva: true, versione: 1,
        creataDa: SYSTEM_ID, modificataDa: SYSTEM_ID,
        tags: SAMPLE.tags[i],
        dati: {
          titolo:          ana.nomi[i],
          note:            SAMPLE.note[i],
          numero:          SAMPLE.numero[i],
          email:           SAMPLE.email[i],
          telefono:        SAMPLE.telefono[i],
          data:            SAMPLE.data[i],
          categoria:       SAMPLE.categoria[i],
          collegato_a:     refTarget?.[i]  ?? null,
          altri_collegati: mrefTarget ? [mrefTarget[0], mrefTarget[1]] : [],
          tipo:            varianteId,
        },
      })
      created.push({ id: String(scheda._id), label: ana.nomi[i] })
    }
    schedeRef[ana.slug] = created
    ok(`${ana.nome}: 3 schede`)
  }

  // ——— 4. Aggiorna cross-ref su tecnici e commerciali ———
  process.stdout.write('\n[4/4] Cross-reference...\n')
  const clientiRef = schedeRef['clienti-prova']
  if (clientiRef) {
    for (const slug of ['tecnici-prova', 'commerciali-prova']) {
      const Scheda = getSchedaModel(slug)
      const schede = await Scheda.find({}).sort({ createdAt: 1 }).lean() as Array<{ _id: unknown; dati: Record<string,unknown> }>
      for (let i = 0; i < schede.length; i++) {
        const dati = { ...schede[i].dati }
        dati.collegato_a     = clientiRef[i] ?? null
        dati.altri_collegati = [clientiRef[0], clientiRef[1]]
        await Scheda.updateOne({ _id: schede[i]._id }, { $set: { dati } })
      }
      ok(`${slug}: cross-reference aggiornati`)
    }
  }

  process.stdout.write('\n Completato!\n\n')
  process.stdout.write('  Route disponibili:\n')
  for (const ana of ANAGRAFICHE) {
    process.stdout.write(`    /anagrafica/${ana.slug}\n`)
  }
  process.stdout.write('\n  Avvia: npm run dev\n\n')

  await mongoose.disconnect()
}

main().catch(e => { err(String(e)); process.exit(1) })
