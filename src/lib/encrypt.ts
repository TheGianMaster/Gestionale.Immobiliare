/**
 * src/lib/encrypt.ts
 * Crittografia password con bcrypt + pepper.
 *
 * Il PEPPER è una stringa segreta aggiunta alla password prima dell'hash.
 * Anche se il db viene compromesso, senza il pepper le password non sono craccabili.
 * Il pepper NON viene salvato nel db — vive solo in .env.local.
 */

import bcrypt from 'bcryptjs'

// Il pepper è opzionale — se non definito, bcrypt da solo è comunque sicuro
const PEPPER = process.env.INVITE_TOKEN_PEPPER || ''
const SALT_ROUNDS = 12

/**
 * Calcola l'hash bcrypt di una password.
 * Se INVITE_TOKEN_PEPPER è definita in .env.local viene aggiunta prima dell'hash.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password + PEPPER, SALT_ROUNDS)
}

/**
 * Verifica una password candidata contro un hash esistente.
 */
export async function comparePassword(
  candidate: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(candidate + PEPPER, hash)
}
