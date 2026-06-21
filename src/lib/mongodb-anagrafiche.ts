/**
 * src/lib/mongodb-anagrafiche.ts
 * Connessione cluster dedicato alle schede anagrafiche e documenti.
 *
 * Cluster separato per isolare il dominio anagrafiche:
 * - schede_{slug}  (es: schede_clienti, schede_fornitori)
 * - documenti      (metadati file caricati su R2)
 *
 * Usa pattern singleton separato da mongodb.ts per mantenere
 * le due connessioni indipendenti.
 */

import mongoose from 'mongoose'

// ——— VARIABILI ENV ———
const MONGODB_URI_ANAGRAFICHE = process.env.MONGODB_URI_ANAGRAFICHE
const MONGODB_DB_ANAGRAFICHE = process.env.MONGODB_DB_ANAGRAFICHE || 'gestionale_anagrafiche'

if (!MONGODB_URI_ANAGRAFICHE) {
  throw new Error(
    '[mongodb-anagrafiche] MONGODB_URI_ANAGRAFICHE non definita in .env.local\n' +
    'Aggiungi: MONGODB_URI_ANAGRAFICHE=mongodb+srv://...'
  )
}

// ——— CACHE GLOBALE ———
declare global {
  // eslint-disable-next-line no-var
  var _mongooseAnagrafiche: mongoose.Connection | undefined
}

/**
 * Connette al cluster anagrafiche e ritorna la Connection mongoose.
 * Usa una Connection separata (createConnection) per non interferire
 * con il cluster principale.
 */
async function connectAnagraficheDB(): Promise<mongoose.Connection> {
  // Già connessa — ritorna subito
  if (
    global._mongooseAnagrafiche &&
    global._mongooseAnagrafiche.readyState === 1
  ) {
    return global._mongooseAnagrafiche
  }

  const options: mongoose.ConnectOptions = {
    dbName: MONGODB_DB_ANAGRAFICHE,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT_MS || '10000'),
    maxPoolSize: 10,
  }

  try {
    const conn = mongoose.createConnection(MONGODB_URI_ANAGRAFICHE!, options)

    // Attendi che la connessione sia aperta
    await conn.asPromise()

    if (process.env.NODE_ENV === 'development') {
      global._mongooseAnagrafiche = conn
    }

    return conn

  } catch (error) {
    console.error('[mongodb-anagrafiche] Errore connessione cluster anagrafiche:', error)
    throw error
  }
}

export default connectAnagraficheDB
