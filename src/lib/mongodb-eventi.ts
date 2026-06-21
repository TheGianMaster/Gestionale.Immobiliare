/**
 * src/lib/mongodb-eventi.ts
 * Connessione cluster dedicato agli eventi del calendario.
 *
 * Cluster separato per isolare il dominio eventi:
 * - eventi  (tutti gli eventi del calendario)
 *
 * Performance: query calendario non competono con query anagrafiche.
 */

import mongoose from 'mongoose'

// ——— VARIABILI ENV ———
const MONGODB_URI_EVENTI = process.env.MONGODB_URI_EVENTI
const MONGODB_DB_EVENTI = process.env.MONGODB_DB_EVENTI || 'gestionale_eventi'

if (!MONGODB_URI_EVENTI) {
  throw new Error(
    '[mongodb-eventi] MONGODB_URI_EVENTI non definita in .env.local\n' +
    'Aggiungi: MONGODB_URI_EVENTI=mongodb+srv://...'
  )
}

// ——— CACHE GLOBALE ———
declare global {
  // eslint-disable-next-line no-var
  var _mongooseEventi: mongoose.Connection | undefined
}

/**
 * Connette al cluster eventi e ritorna la Connection mongoose.
 */
async function connectEventiDB(): Promise<mongoose.Connection> {
  // Già connessa — ritorna subito
  if (
    global._mongooseEventi &&
    global._mongooseEventi.readyState === 1
  ) {
    return global._mongooseEventi
  }

  const options: mongoose.ConnectOptions = {
    dbName: MONGODB_DB_EVENTI,
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT_MS || '10000'),
    maxPoolSize: 5, // cluster eventi ha traffico inferiore
  }

  try {
    const conn = mongoose.createConnection(MONGODB_URI_EVENTI!, options)

    await conn.asPromise()

    if (process.env.NODE_ENV === 'development') {
      global._mongooseEventi = conn
    }

    return conn

  } catch (error) {
    console.error('[mongodb-eventi] Errore connessione cluster eventi:', error)
    throw error
  }
}

export default connectEventiDB
