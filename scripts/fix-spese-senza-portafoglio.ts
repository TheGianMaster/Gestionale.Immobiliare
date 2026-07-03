/**
 * scripts/fix-spese-senza-portafoglio.ts
 *
 * Controlla tutte le schede dell'anagrafica "spese": quelle che NON hanno
 * nessuna riga in `fondi_provenienza` (campo derivato dal modulo Bilancio,
 * vedi docs/12-BILANCIO.md §5/§6.1) vengono corrette impostando come unica
 * provenienza il Portafoglio con titolo contenente "genitori" (match
 * case-insensitive su dati.titolo, anagrafica Portafogli — NESSUN passaggio
 * tramite Debiti), per l'intero importo_totale della spesa.
 *
 * USO:
 *   npm run fix:spese-provenienza              -> DRY RUN, non scrive nulla
 *   npm run fix:spese-provenienza -- --apply    -> applica le modifiche
 *
 * Dopo l'applicazione, ricalcola `fondi_disponibili` del portafoglio
 * "genitori" (motore di ricalcolo, T-114) cosi' il valore mostrato nel
 * Bilancio resta coerente con le nuove righe aggiunte.
 *
 * NOTA IMPORT: stesso pattern di scripts/ricalcola-fondi.ts — dotenv.config()
 * viene chiamato PRIMA di qualunque import (anche dinamico) che tocchi
 * src/lib/mongodb*.ts, per evitare che quei moduli leggano process.env prima
 * che sia popolato.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const APPLY = process.argv.includes('--apply')

const ok    = (msg: string) => console.log('  \x1b[32mOK\x1b[0m  ' + msg)
const log   = (msg: string) => console.log('  --  ' + msg)
const warn  = (msg: string) => console.log('  \x1b[33m!!\x1b[0m  ' + msg)
const err   = (msg: string) => console.log('  \x1b[31mXX\x1b[0m  ' + msg)

interface RigaFondo { fondo: { id: string; label: string }; importo: number }

async function main() {
  const mongoose = (await import('mongoose')).default
  const { getSchedaModel } = await import('../src/models/Scheda')
  const { ricalcolaFondiPortafoglio } = await import('../src/lib/bilancio/ricalcolaFondiPortafoglio')

  console.log(`\n--- Controllo provenienza fondi delle Spese ${APPLY ? '(APPLY)' : '(DRY RUN — nessuna scrittura)'} ---\n`)

  const [SchedaPortafogli, SchedaSpese] = await Promise.all([
    getSchedaModel('portafogli'),
    getSchedaModel('spese'),
  ])

  // ── 1. Trova il Portafoglio "genitori" direttamente (nessun Debito coinvolto) ──
  const portafogliCandidati = await SchedaPortafogli.find({
    attiva: true,
    'dati.titolo': { $regex: 'genitori', $options: 'i' },
  }).lean()

  if (portafogliCandidati.length === 0) {
    err('Nessun portafoglio con titolo contenente "genitori" trovato. Verifica il titolo esatto nella scheda Portafogli e rilancia lo script (eventualmente adattando il filtro).')
    await mongoose.disconnect()
    process.exit(1)
  }
  if (portafogliCandidati.length > 1) {
    err(`Trovati ${portafogliCandidati.length} portafogli con titolo contenente "genitori" — ambiguo, correggo manualmente:`)
    for (const p of portafogliCandidati) {
      log(`  - ${String(p._id)}: "${(p.dati as Record<string, unknown>)?.titolo}"`)
    }
    await mongoose.disconnect()
    process.exit(1)
  }
  const portafoglioGenitori = portafogliCandidati[0]
  const portafoglioGenitoriId = String(portafoglioGenitori._id)
  const portafoglioGenitoriTitolo = String((portafoglioGenitori.dati as Record<string, unknown>)?.titolo ?? 'Portafoglio')
  ok(`Portafoglio "genitori" trovato: "${portafoglioGenitoriTitolo}" (${portafoglioGenitoriId})\n`)

  // ── 2. Scansiona tutte le Spese ─────────────────────────────────────────────
  const spese = await SchedaSpese.find({ attiva: true }).lean()
  log(`Spese totali trovate: ${spese.length}\n`)

  const daCorreggere: { id: string; titolo: string; importoTotale: number }[] = []
  let giaConProvenienza = 0

  for (const s of spese) {
    const dati = (s.dati as Record<string, unknown>) ?? {}
    const righe = (dati.fondi_provenienza ?? []) as RigaFondo[]
    const haProvenienza = Array.isArray(righe) && righe.length > 0

    if (haProvenienza) {
      giaConProvenienza++
      continue
    }

    const importoTotale = Number(dati.importo_totale)
    daCorreggere.push({
      id: String(s._id),
      titolo: String(dati.titolo ?? '(senza titolo)'),
      importoTotale: Number.isFinite(importoTotale) ? importoTotale : 0,
    })
  }

  ok(`Spese già con provenienza: ${giaConProvenienza}`)
  log(`Spese senza provenienza da correggere: ${daCorreggere.length}\n`)

  if (daCorreggere.length === 0) {
    ok('Nessuna correzione necessaria.')
    await mongoose.disconnect()
    process.exit(0)
  }

  for (const spesa of daCorreggere) {
    if (spesa.importoTotale <= 0) {
      warn(`"${spesa.titolo}" (${spesa.id}): importo_totale mancante o non valido (${spesa.importoTotale}) — verrà impostata una riga con importo 0, controllare manualmente.`)
    } else {
      log(`"${spesa.titolo}" (${spesa.id}): provenienza → "${portafoglioGenitoriTitolo}", importo ${spesa.importoTotale.toFixed(2)} €`)
    }
  }

  if (!APPLY) {
    console.log(`\n${daCorreggere.length} spese verrebbero corrette. Rilancia con "-- --apply" per applicare davvero.\n`)
    await mongoose.disconnect()
    process.exit(0)
  }

  // ── 3. Applica le correzioni ───────────────────────────────────────────
  console.log('\n--- Applico le correzioni ---\n')
  for (const spesa of daCorreggere) {
    const rigaFondo: RigaFondo = {
      fondo: { id: portafoglioGenitoriId, label: portafoglioGenitoriTitolo },
      importo: spesa.importoTotale,
    }
    await SchedaSpese.updateOne(
      { _id: spesa.id },
      { $set: { 'dati.fondi_provenienza': [rigaFondo] } }
    )
    ok(`"${spesa.titolo}" (${spesa.id}) corretta.`)
  }

  // ── 4. Ricalcola fondi_disponibili del portafoglio genitori ──────────────
  try {
    const nuovoValore = await ricalcolaFondiPortafoglio(portafoglioGenitoriId)
    ok(`\nRicalcolo fondi_disponibili portafoglio "${portafoglioGenitoriTitolo}": ${nuovoValore.toFixed(2)} €`)
  } catch (e) {
    warn(`Ricalcolo fondi_disponibili fallito: ${e instanceof Error ? e.message : String(e)}. Esegui "npm run ricalcola:fondi" per riconciliare.`)
  }

  await mongoose.disconnect()
  console.log('\n\x1b[32mCompletato.\x1b[0m\n')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
