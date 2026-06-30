/**
 * src/models/User.ts
 * Modello Mongoose per gli utenti del gestionale.
 *
 * ⚠️ NOTA SUL CAMPO PASSWORD:
 * Per creare un utente imposta `user.passwordHash = plainTextPassword`.
 * Sembra controintuitivo ma è intenzionale: il hook pre('save')
 * intercetta il valore, lo concatena con il pepper e lo sostituisce con l'hash bcrypt.
 * Non salvare mai una password in chiaro nel db.
 */

import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

// ——— TIPI ———

export type UserRole = 'admin' | 'operatore'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  nome: string
  cognome: string
  ruolo: UserRole
  attivo: boolean
  lastLogin?: Date
  // NOTA: sessionDuration sarà configurabile dal Pannello Controllo > Utenze (WIP — T-090)
  sessionDuration: number // ore, default 72
  createdAt: Date
  updatedAt: Date

  // Metodi istanza
  comparePassword(candidatePassword: string): Promise<boolean>
  nomeCompleto(): string
}

export interface IUserModel extends Model<IUser> {
  // Metodi statici (se necessari in futuro)
}

// ——— SCHEMA ———

const UserSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email obbligatoria'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Formato email non valido'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password obbligatoria'],
      minlength: [8, 'La password deve essere di almeno 8 caratteri'],
    },
    nome: {
      type: String,
      required: [true, 'Nome obbligatorio'],
      trim: true,
      maxlength: [100, 'Nome troppo lungo'],
    },
    cognome: {
      type: String,
      required: [true, 'Cognome obbligatorio'],
      trim: true,
      maxlength: [100, 'Cognome troppo lungo'],
    },
    ruolo: {
      type: String,
      enum: {
        values: ['admin', 'operatore'],
        message: 'Ruolo non valido: {VALUE}',
      },
      default: 'operatore',
    },
    attivo: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    sessionDuration: {
      type: Number,
      default: 72,
      min: [1, 'Durata sessione minima: 1 ora'],
      max: [720, 'Durata sessione massima: 720 ore (30 giorni)'],
    },
  },
  {
    timestamps: true, // aggiunge createdAt e updatedAt automaticamente
  }
)

// ——— INDICI ———
// NOTA: email ha già unique:true nella definizione del campo — non serve ridichiararlo qui
// (Mongoose + Turbopack emette errore su indici duplicati)
UserSchema.index({ ruolo: 1, attivo: 1 })

// ——— HOOK PRE-SAVE: crittografia password ———
// Viene eseguito ogni volta che passwordHash viene modificato.
// Trasforma il testo in chiaro in: bcrypt.hash(password + PEPPER, 12)
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()

  const pepper = process.env.INVITE_TOKEN_PEPPER || ''
  const pepperedPassword = this.passwordHash + pepper

  try {
    this.passwordHash = await bcrypt.hash(pepperedPassword, 12)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// ——— METODI ISTANZA ———

/**
 * Verifica una password candidata contro l'hash salvato.
 * Applica il pepper prima del confronto.
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const pepper = process.env.INVITE_TOKEN_PEPPER || ''
  return bcrypt.compare(candidatePassword + pepper, this.passwordHash)
}

/**
 * Ritorna nome e cognome concatenati.
 */
UserSchema.methods.nomeCompleto = function (): string {
  return `${this.nome} ${this.cognome}`
}

// ——— EXPORT ———
// Usa il modello esistente se già registrato (Next.js hot reload safe)
export const User = (
  mongoose.models?.User as IUserModel | undefined
) ?? mongoose.model<IUser, IUserModel>('User', UserSchema)

export default User
