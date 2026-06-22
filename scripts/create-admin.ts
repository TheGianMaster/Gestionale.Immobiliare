/**
 * scripts/create-admin.ts
 * Crea un utente admin interattivamente dal terminale.
 *
 * Uso: npm run create:admin
 * Richiede solo MONGODB_URI e INVITE_TOKEN_PEPPER in .env.local
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'
import mongoose from 'mongoose'

const envPath = path.resolve(process.cwd(), '.env.local')
const envResult = dotenv.config({ path: envPath })

console.log(`\n🔍 Cerco .env.local in: ${envPath}`)
if (envResult.error) {
  console.error(`❌ File non trovato o non leggibile: ${envResult.error.message}`)
  process.exit(1)
}

// Normalizza tutte le chiavi (trim + rimuovi caratteri invisibili) e forza in process.env
const parsed = envResult.parsed || {}
for (const rawKey of Object.keys(parsed)) {
  const cleanKey = rawKey.replace(/^﻿/, '').trim() // rimuove BOM e spazi
  process.env[cleanKey] = parsed[rawKey]
}

const variabiliCaricate = Object.keys(parsed).map(k => k.trim())
console.log(`✅ Variabili caricate (${variabiliCaricate.length}): ${variabiliCaricate.join(', ')}\n`)

// ——— UTILITY: leggi input dal terminale ———
function chiedi(domanda: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(domanda, (risposta) => {
      rl.close()
      resolve(risposta.trim())
    })
  })
}

// ——— UTILITY: leggi password (nascosta) ———
function chiediPassword(domanda: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    process.stdout.write(domanda)

    // Nascondi l'input
    process.stdin.setRawMode?.(true)
    let password = ''

    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const handler = (char: string) => {
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode?.(false)
        process.stdin.removeListener('data', handler)
        process.stdout.write('\n')
        rl.close()
        resolve(password)
      } else if (char === '') {
        // Ctrl+C
        process.exit()
      } else if (char === '') {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1)
          process.stdout.write('\b \b')
        }
      } else {
        password += char
        process.stdout.write('*')
      }
    }

    process.stdin.on('data', handler)
  })
}

async function main() {
  console.log('\n╔══════════════════════════════════╗')
  console.log('║   Creazione Utente Admin          ║')
  console.log('╚══════════════════════════════════╝\n')

  // ——— VALIDAZIONE ENV ———
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI non trovata nel .env.local')
    process.exit(1)
  }
  if (process.env.INVITE_TOKEN_PEPPER) {
    console.log(`✅ INVITE_TOKEN_PEPPER trovata — password hashata con pepper.`)
  } else {
    console.log(`ℹ️  INVITE_TOKEN_PEPPER non impostata — password hashata con solo bcrypt (sicuro).`)
  }

  // ——— INPUT INTERATTIVO ———
  const email = await chiedi('📧 Email admin: ')
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error('❌ Email non valida')
    process.exit(1)
  }

  const nome    = await chiedi('👤 Nome: ')
  const cognome = await chiedi('👤 Cognome: ')
  const password = await chiediPassword('🔒 Password: ')

  if (password.length < 8) {
    console.error('❌ La password deve essere di almeno 8 caratteri')
    process.exit(1)
  }

  // ——— CONNESSIONE DB ———
  console.log('\n🔌 Connessione a MongoDB...')
  const mongoUri = process.env.MONGODB_URI
  const mongoDB  = process.env.MONGODB_DB || 'gestionale'
  await mongoose.connect(mongoUri, { dbName: mongoDB })
  console.log(`✅ Connesso: ${mongoDB}`)

  // ——— MODELLO ———
  const { User } = await import('../src/models/User')

  // ——— CONTROLLO ESISTENZA ———
  const esistente = await User.findOne({ email: email.toLowerCase() })
  if (esistente) {
    console.log(`\nℹ️  Utente già esistente: ${email}`)
    console.log(`   Ruolo: ${esistente.ruolo} | Attivo: ${esistente.attivo}`)
    await mongoose.disconnect()
    process.exit(0)
  }

  // ——— CREAZIONE ———
  const admin = new User({
    email:        email.toLowerCase(),
    passwordHash: password,  // il hook pre('save') la hash automaticamente
    nome:         nome || 'Admin',
    cognome:      cognome || 'Sistema',
    ruolo:        'admin',
    attivo:       true,
  })

  await admin.save()

  console.log('\n✅ Admin creato con successo!')
  console.log(`   Email:  ${admin.email}`)
  console.log(`   Nome:   ${admin.nomeCompleto()}`)
  console.log(`   Ruolo:  ${admin.ruolo}`)
  console.log(`   ID:     ${admin._id}\n`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error('\n❌ Errore:', err.message)
  process.exit(1)
})
