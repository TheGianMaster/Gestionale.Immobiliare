/**
 * scripts/setup-r2.ts
 * Verifica l'esistenza del bucket Cloudflare R2 configurato in .env.local.
 * Se non esiste, chiede conferma e lo crea.
 *
 * Uso: npm run setup:r2
 * Richiede: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET in .env.local
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3'

// Carica .env.local dalla root del progetto
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ── Validazione variabili d'ambiente ─────────────────────────
const R2_ENDPOINT        = process.env.R2_ENDPOINT
const R2_ACCESS_KEY_ID   = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_KEY      = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET          = process.env.R2_BUCKET

const RESET  = '\x1b[0m'
const GREEN  = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RED    = '\x1b[31m'
const CYAN   = '\x1b[36m'
const BOLD   = '\x1b[1m'

function ok(msg: string)   { console.log(`${GREEN}✔${RESET}  ${msg}`) }
function warn(msg: string) { console.log(`${YELLOW}⚠${RESET}  ${msg}`) }
function err(msg: string)  { console.log(`${RED}✖${RESET}  ${msg}`) }
function info(msg: string) { console.log(`${CYAN}ℹ${RESET}  ${msg}`) }

// ── Prompt interattivo ────────────────────────────────────────
function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log()
  console.log(`${BOLD}${CYAN}╔══════════════════════════════════════╗`)
  console.log(`║     Setup Cloudflare R2 — Bucket     ║`)
  console.log(`╚══════════════════════════════════════╝${RESET}`)
  console.log()

  // Controllo variabili
  const missingVars: string[] = []
  if (!R2_ENDPOINT)      missingVars.push('R2_ENDPOINT')
  if (!R2_ACCESS_KEY_ID) missingVars.push('R2_ACCESS_KEY_ID')
  if (!R2_SECRET_KEY)    missingVars.push('R2_SECRET_ACCESS_KEY')
  if (!R2_BUCKET)        missingVars.push('R2_BUCKET')

  if (missingVars.length > 0) {
    err(`Variabili mancanti in .env.local:`)
    missingVars.forEach((v) => console.log(`     ${RED}→${RESET} ${v}`))
    console.log()
    info('Aggiungi le variabili mancanti in .env.local e riprova.')
    process.exit(1)
  }

  info(`Endpoint:  ${R2_ENDPOINT}`)
  info(`Bucket:    ${BOLD}${R2_BUCKET}${RESET}`)
  console.log()

  // Crea client S3
  const client = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT!,
    credentials: {
      accessKeyId:     R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_KEY!,
    },
  })

  // ── Verifica connessione (lista bucket) ───────────────────
  info('Verifica connessione a Cloudflare R2...')
  try {
    await client.send(new ListBucketsCommand({}))
    ok('Connessione riuscita.')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    err(`Impossibile connettersi a R2: ${msg}`)
    console.log()
    info('Controlla che R2_ENDPOINT, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY siano corretti.')
    process.exit(1)
  }

  console.log()

  // ── Verifica esistenza bucket ─────────────────────────────
  info(`Verifica bucket "${R2_BUCKET}"...`)
  let bucketEsiste = false

  try {
    await client.send(new HeadBucketCommand({ Bucket: R2_BUCKET! }))
    bucketEsiste = true
  } catch (e: unknown) {
    const status = (e as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode
    if (status === 404 || status === 403) {
      bucketEsiste = false
    } else {
      const msg = e instanceof Error ? e.message : String(e)
      err(`Errore durante la verifica: ${msg}`)
      process.exit(1)
    }
  }

  if (bucketEsiste) {
    ok(`Il bucket "${BOLD}${R2_BUCKET}${RESET}" esiste già. Nessuna azione necessaria.`)
    console.log()
    process.exit(0)
  }

  // ── Bucket non trovato → chiedi se crearlo ────────────────
  warn(`Il bucket "${BOLD}${R2_BUCKET}${RESET}" non esiste.`)
  console.log()

  const risposta = await ask(`  Vuoi crearlo ora? ${BOLD}[s/n]${RESET} `)

  if (risposta !== 's' && risposta !== 'si' && risposta !== 'sì' && risposta !== 'y' && risposta !== 'yes') {
    console.log()
    warn('Operazione annullata. Il bucket non è stato creato.')
    console.log()
    info(`Crealo manualmente su https://dash.cloudflare.com → R2 → Create bucket`)
    info(`e imposta R2_BUCKET="${R2_BUCKET}" in .env.local`)
    process.exit(0)
  }

  // ── Crea bucket ───────────────────────────────────────────
  console.log()
  info(`Creazione bucket "${R2_BUCKET}" in corso...`)

  try {
    await client.send(new CreateBucketCommand({ Bucket: R2_BUCKET! }))
    ok(`Bucket "${BOLD}${R2_BUCKET}${RESET}" creato con successo!`)
    console.log()
    info('Prossimi step consigliati:')
    console.log(`     ${CYAN}→${RESET} Imposta le regole CORS dal pannello Cloudflare R2`)
    console.log(`     ${CYAN}→${RESET} Verifica i permessi del token API`)
    console.log(`     ${CYAN}→${RESET} Riavvia il server: npm run dev`)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    err(`Errore durante la creazione del bucket: ${msg}`)
    console.log()
    info('Prova a crearlo manualmente su https://dash.cloudflare.com → R2 → Create bucket')
    process.exit(1)
  }

  console.log()
}

main().catch((e) => {
  err(`Errore imprevisto: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
