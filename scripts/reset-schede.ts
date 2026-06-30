/**
 * scripts/reset-schede.ts
 * Elimina TUTTE le schede di una specifica anagrafica (DB + R2).
 *
 * USO: npm run reset:schede -- <slug>
 * ES:  npm run reset:schede -- spese
 *
 * Cosa viene eliminato:
 *   - Tutte le schede nella collection `schede_<slug>`
 *   - Tutti i documenti allegati (collection `documenti`, filtro anagraficaSlug)
 *   - I corrispondenti file su R2 (tramite s3Key)
 *
 * La configurazione dell'anagrafica (variabili, select options, ecc.) NON viene toccata.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import mongoose from 'mongoose'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

const ok   = (msg: string) => console.log('  \x1b[32mOK\x1b[0m  ' + msg)
const log  = (msg: string) => console.log('  --  ' + msg)
const warn = (msg: string) => console.log('  \x1b[33m!!\x1b[0m  ' + msg)

// ── Slug da argomento CLI ─────────────────────────────────────────────────────
const slug = process.argv[2]?.trim().toLowerCase()

if (!slug) {
  console.error('\nErrore: specifica lo slug dell\'anagrafica.')
  console.error('  Esempio: npm run reset:schede -- spese\n')
  process.exit(1)
}

// ── Conferma interattiva ──────────────────────────────────────────────────────
async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => {
    rl.question(
      `\n\x1b[31mATTENZIONE\x1b[0m: stai per eliminare TUTTE le schede dell'anagrafica "\x1b[1m${slug}\x1b[0m".\n` +
      `   Digita "ELIMINA" per confermare: `,
      ans => { rl.close(); resolve(ans.trim() === 'ELIMINA') }
    )
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (!(await confirm())) {
    console.log('\n  Operazione annullata.\n')
    process.exit(0)
  }

  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI non trovata in .env.local')
  const dbName = process.env.MONGODB_DB ?? 'gestionale'

  console.log('\n--- Connessione DB ---')
  await mongoose.connect(uri, { dbName })
  ok(`Connesso a "${dbName}"`)

  const db = mongoose.connection.db!
  const collName = `schede_${slug}`

  // ── Trova la collection reale (Mongoose potrebbe aver pluralizzato il nome) ────
  const allColls = await db.listCollections().toArray()
  const collNames = allColls.map(c => c.name)
  // Cerca match esatto, poi con 's' aggiunta (pluralizzazione Mongoose)
  const realCollName = collNames.includes(collName)
    ? collName
    : collNames.includes(collName + 's')
      ? collName + 's'
      : null

  log(`Collection schede nel DB: ${collNames.filter(n => n.startsWith('schede_')).join(', ')}`)
  log(`Cerco: "${collName}" → trovata come: "${realCollName ?? 'NON TROVATA'}"`)
  const targetColl = realCollName

  // ── 1. Raccogli i documenti allegati prima di eliminare ──────────────────────
  console.log(`\n--- Raccolta documenti allegati a "${slug}" ---`)
  const docsColl = db.collection('documenti')
  const docs = await docsColl.find({ anagraficaSlug: slug }, { projection: { s3Key: 1 } }).toArray()
  log(`${docs.length} documento/i trovato/i`)

  // ── 2. Elimina schede ────────────────────────────────────────────────────────
  console.log(`\n--- Pulizia schede (${targetColl ?? collName}) ---`)
  if (!targetColl) {
    warn(`Collection per "${slug}" non trovata — nessuna scheda da eliminare`)
  } else {
    const res = await db.collection(targetColl).deleteMany({})
    ok(`${targetColl}: ${res.deletedCount} schede eliminate`)
  }

  // ── 3. Elimina documenti ─────────────────────────────────────────────────────
  console.log('\n--- Pulizia documenti ---')
  if (docs.length > 0) {
    const resDocs = await docsColl.deleteMany({ anagraficaSlug: slug })
    ok(`documenti: ${resDocs.deletedCount} eliminati`)
  } else {
    log('Nessun documento da eliminare')
  }

  // ── 4. Elimina file da R2 ────────────────────────────────────────────────────
  const r2Key    = process.env.R2_ACCESS_KEY_ID
  const r2Secret = process.env.R2_SECRET_ACCESS_KEY
  const r2Bucket = process.env.R2_BUCKET_NAME
  const r2Url    = process.env.R2_ENDPOINT_URL

  console.log('\n--- Pulizia file R2 ---')
  if (docs.length === 0) {
    log('Nessun file da eliminare da R2')
  } else if (!r2Key || !r2Secret || !r2Bucket || !r2Url) {
    warn('R2 non configurato — i file allegati NON sono stati eliminati da R2')
  } else {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: r2Url,
      credentials: { accessKeyId: r2Key, secretAccessKey: r2Secret },
    })
    let deleted = 0, errors = 0
    for (const doc of docs) {
      const key = doc.s3Key as string
      if (!key) continue
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }))
        deleted++
      } catch (e) {
        warn(`Errore eliminando ${key}: ${e}`)
        errors++
      }
    }
    ok(`R2: ${deleted} file eliminati${errors > 0 ? ` (${errors} errori)` : ''}`)
  }

  await mongoose.disconnect()
  console.log(`\n\x1b[32mReset "${slug}" completato.\x1b[0m\n`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
