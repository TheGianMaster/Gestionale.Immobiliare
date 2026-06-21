# 🔐 DOC-01 — AUTENTICAZIONE & UTENTI
> **Leggi questo file per:** T-010, T-011, T-012, T-013, T-130
> **File chiave:** `src/models/User.ts`, `src/lib/auth.ts`, `src/middleware.ts`

---

## 1. SCHEMA USER — Modello MongoDB

```typescript
// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser extends Document {
  email: string
  passwordHash: string
  nome: string
  cognome: string
  ruolo: 'admin' | 'operatore'
  attivo: boolean
  lastLogin?: Date
  sessionDuration: number  // ore, default 72. Override futuro da pannello admin.
  createdAt: Date
  updatedAt: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  nome: { type: String, required: true, trim: true },
  cognome: { type: String, required: true, trim: true },
  ruolo: {
    type: String,
    enum: ['admin', 'operatore'],
    default: 'operatore',
  },
  attivo: { type: Boolean, default: true },
  lastLogin: { type: Date },
  // NOTA: sessionDuration sarà configurabile dal Pannello Controllo > Utenze (WIP)
  sessionDuration: { type: Number, default: 72 },
}, {
  timestamps: true,
})

// ——— CRITTOGRAFIA PASSWORD ———
// Il campo ricevuto in input è "password" (plain text).
// Prima del save, lo trasformiamo in passwordHash usando bcrypt + pepper.
// Il pepper è INVITE_TOKEN_PEPPER dall'env — aggiunge entropia oltre al salt bcrypt.
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next()

  const pepper = process.env.INVITE_TOKEN_PEPPER || ''
  const pepperedPassword = this.passwordHash + pepper  // password + pepper prima di hashare
  this.passwordHash = await bcrypt.hash(pepperedPassword, 12)
  next()
})

// ——— METODO CONFRONTO PASSWORD ———
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  const pepper = process.env.INVITE_TOKEN_PEPPER || ''
  return bcrypt.compare(candidatePassword + pepper, this.passwordHash)
}

// Esporta il modello (singolare per Mongoose)
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
```

### ⚠️ NOTA IMPORTANTE SUL CAMPO PASSWORD
Per creare un utente, imposta `user.passwordHash = plainTextPassword` (sembra controintuitivo ma è gestito dall'hook `pre('save')`). L'hook intercetta prima del salvataggio e lo trasforma in hash.

---

## 2. NEXTAUTH CONFIG

```typescript
// src/lib/auth.ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
          attivo: true,
        })

        if (!user) return null

        const isValid = await user.comparePassword(credentials.password as string)
        if (!isValid) return null

        // Aggiorna lastLogin
        await User.updateOne({ _id: user._id }, { lastLogin: new Date() })

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.nome} ${user.cognome}`,
          ruolo: user.ruolo,
          nome: user.nome,
          cognome: user.cognome,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    // 72 ore in secondi
    // NOTA: questo sarà poi configurabile per utente dal Pannello Controllo > Utenze
    maxAge: 72 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.ruolo = (user as any).ruolo
        token.nome = (user as any).nome
        token.cognome = (user as any).cognome
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.ruolo = token.ruolo as string
        session.user.nome = token.nome as string
        session.user.cognome = token.cognome as string
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})
```

---

## 3. MIDDLEWARE PROTEZIONE ROUTE

```typescript
// src/middleware.ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  // Route pubbliche (non richiedono auth)
  const publicRoutes = ['/login']

  if (publicRoutes.includes(pathname)) {
    // Se già autenticato, redirect a dashboard
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Tutto il resto richiede auth
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Pannello controllo: solo admin
  if (pathname.startsWith('/controllo')) {
    const ruolo = (req.auth?.user as any)?.ruolo
    if (ruolo !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
```

---

## 4. TYPES ESTESI NEXTAUTH

```typescript
// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string
      ruolo: string
      nome: string
      cognome: string
    }
  }
}
```

---

## 5. SCRIPT SEED ADMIN

```typescript
// scripts/seed-admin.ts
import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../src/models/User'

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!email || !password) {
    console.error('❌ SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD richiesti nel .env.local')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI!, {
    dbName: process.env.MONGODB_DB || 'gestionale',
  })

  const esistente = await User.findOne({ email })
  if (esistente) {
    console.log('ℹ️ Admin già esistente:', email)
    await mongoose.disconnect()
    return
  }

  const admin = new User({
    email,
    passwordHash: password,  // Verrà hashato dall'hook pre-save
    nome: 'Admin',
    cognome: 'Sistema',
    ruolo: 'admin',
    attivo: true,
  })

  await admin.save()
  console.log('✅ Admin creato:', email)
  await mongoose.disconnect()
}

seedAdmin().catch(console.error)
```

---

## 6. PAGINA LOGIN — Specifiche UI

### Layout
- Centrata verticalmente e orizzontalmente nella viewport
- Card con sfondo bianco/superficie, ombra leggera, border-radius `tokens.radius.lg`
- Logo / nome app in cima alla card
- Form con campi email e password
- Password con toggle show/hide (icona occhio)
- Pulsante submit full-width con stato loading
- Link "Hai dimenticato la password?" (placeholder — WIP)

### Messaggi errore
| Scenario | Messaggio |
|----------|-----------|
| Credenziali errate | "Email o password non corretti. Riprova." |
| Account disattivo | "Il tuo account è stato disattivato. Contatta l'amministratore." |
| Errore generico | "Si è verificato un errore. Riprova tra qualche istante." |

### Nota sessione (da mostrare sotto il form)
```
ℹ️ La sessione rimane attiva per 72 ore dal login.
   Il tempo di logout automatico sarà configurabile dal
   Pannello Controllo → Utenze.
```

---

## 7. SICUREZZA — CHECKLIST

- [ ] Password min 8 caratteri, validazione client+server
- [ ] Rate limiting su `/api/auth/callback/credentials` (max 10 req/min per IP)
- [ ] bcrypt con cost factor 12 (adeguato al 2024-2025)
- [ ] Pepper in env, mai nel codice
- [ ] Session JWT firmato con NEXTAUTH_SECRET
- [ ] `attivo: false` impedisce login senza eliminare l'utente
- [ ] `lastLogin` aggiornato ad ogni accesso per audit trail
