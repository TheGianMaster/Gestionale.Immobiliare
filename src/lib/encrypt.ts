/**
 * src/lib/encrypt.ts
 * Crittografia password con bcrypt + pepper.
 *
 * Il PEPPER è una stringa segreta aggiunta alla password prima dell'hash.
 * Anche se il db viene compromesso, senza il pepper le password non sono craccabili.
 * Il pepper NON viene salvato nel db — vive solo in .env.local.
 */

import bcrypt from 'bcryptjs'

const PEPPER = process.env.INVITE_TOKEN_PEPPER

if (!PEPPER) {
  throw new Error(
    '[encrypt] INVITE_TOKEN_PEPPER non definita in .env.local\n' +
    'Genera con: openssl rand -hex 32'
  )
}

const SALT_ROUNDS = 12

/**
 * Calcola l'hash bcrypt di una password con pepper.
 * Usato nel pre-save hook del modello User (T-010).
 */
export async function hashPassword(password: string): Promise<string> {
  const withPepper = password + PEPPER
  return bcrypt.hash(withPepper, SALT_ROUNDS)
}

/**
 * Verifica una password candidata contro un hash esistente.
 * Ritorna true se la password è corretta.
 */
export async function comparePassword(
  candidate: string,
  hash: string
): Promise<boolean> {
  const withPepper = candidate + PEPPER
  return bcrypt.compare(withPepper, hash)
}
