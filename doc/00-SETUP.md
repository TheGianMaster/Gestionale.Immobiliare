# 📦 DOC-00 — SETUP & CONFIGURAZIONE PROGETTO
> **Leggi questo file per:** T-001, T-002, T-004, T-013, T-120, T-140
> **Dipendenze:** nessuna — è il punto di partenza.

---

## 1. INIZIALIZZAZIONE NEXT.JS

```bash
npx create-next-app@latest gestionale \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

Poi installa ESLint manualmente con config più stretta:
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-next prettier eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks
```

---

## 2. DIPENDENZE NPM COMPLETE

```bash
# Core
npm install mongoose next-auth@beta bcryptjs zod date-fns

# AWS S3 per Cloudflare R2
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# UI / Componenti
npm install @radix-ui/react-dialog @radix-ui/react-popover @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-toast @radix-ui/react-tabs lucide-react clsx tailwind-merge

# Email + Comunicazioni
npm install resend

# Dev types
npm install --save-dev @types/bcryptjs @types/node tsx

# Script runner (per seed)
npm install --save-dev tsx
```

---

## 3. VARIABILI D'AMBIENTE — .env.example

```bash
# =============================================
# NEXTAUTH
# =============================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                          # genera con: openssl rand -base64 32

# =============================================
# MONGODB — Connessioni cluster
# =============================================
MONGODB_URI=                              # DB principale (users, config, notifiche)
MONGODB_DB=gestionale

# Cluster separati (vedi docs/02-DATABASE.md per architettura)
MONGODB_URI_ANAGRAFICHE=                  # Cluster dedicato alle schede anagrafiche
MONGODB_URI_EVENTI=                       # Cluster dedicato agli eventi calendario
MONGODB_URI_AULE=                         # Cluster aule (espansione futura)

# =============================================
# CLOUDFLARE R2 — Storage documenti
# =============================================
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=gestionale-documenti
R2_ENDPOINT=                              # https://{account_id}.r2.cloudflarestorage.com
R2_JURISDICTION=eu                        # eu | us | apac

# =============================================
# AUTH & CRITTOGRAFIA
# =============================================
INVITE_TOKEN_PEPPER=                      # Stringa segreta per pepper password. CAMBIARE IN PROD.
                                          # Genera con: openssl rand -hex 32

# =============================================
# EMAIL (Resend)
# =============================================
RESEND_API_KEY=
EMAIL_FROM="Gestionale <noreply@tuodominio.it>"

# =============================================
# AI (Groq)
# =============================================
GROQ_API_KEY=
GROQ_MODEL=groq/compound

# =============================================
# TWILIO (SMS / WhatsApp)
# =============================================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+17754878788

# =============================================
# APP CONFIG
# =============================================
APP_URL=http://localhost:3000

# =============================================
# SEED (solo sviluppo — non committare con valori)
# =============================================
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=                      # Password sicura per admin iniziale
```

---

## 4. TSCONFIG.JSON — PATH ALIASES

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/models/*": ["./src/models/*"],
      "@/skills/*": ["../skills/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 5. PACKAGE.JSON — SCRIPTS

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "seed:admin": "tsx scripts/seed-admin.ts",
    "seed:data": "tsx scripts/seed-data.ts",
    "seed:all": "npm run seed:admin && npm run seed:data"
  }
}
```

---

## 6. STRUTTURA .GITIGNORE

Aggiungi al `.gitignore` generato da Next.js:
```
# Environment
.env.local
.env.*.local
!.env.example

# Scripts output
scripts/output/

# OS
.DS_Store
Thumbs.db
```

---

## 7. CONNESSIONI MONGODB — PATTERN SINGLETON

### ⚠️ IMPORTANTE
Next.js in modalità sviluppo fa hot-reload frequente. Senza il pattern singleton, si aprono decine di connessioni MongoDB. Il pattern qui sotto lo previene.

```typescript
// src/lib/mongodb.ts — TEMPLATE (da replicare per mongodb-anagrafiche.ts e mongodb-eventi.ts)
import mongoose from 'mongoose'

// Variabile cached globale (persiste tra hot-reload)
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Promise<typeof mongoose> | undefined
}

const MONGODB_URI = process.env.MONGODB_URI!
const MONGODB_DB = process.env.MONGODB_DB || 'gestionale'

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI non definita in .env.local')
}

async function connectDB(): Promise<typeof mongoose> {
  // Se già connesso, ritorna subito
  if (mongoose.connection.readyState === 1) {
    return mongoose
  }

  // In sviluppo, usa cache globale per evitare riconnessioni su hot-reload
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongooseConn) {
      global._mongooseConn = mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB })
    }
    return global._mongooseConn
  }

  // In produzione, connessione normale
  return mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB })
}

export default connectDB
```

---

## 8. CHECKLIST PRIMA DEL DEPLOY

```
[ ] NEXTAUTH_SECRET generato con openssl rand -base64 32
[ ] INVITE_TOKEN_PEPPER unico e segreto
[ ] MONGODB_URI punta a cluster produzione
[ ] R2_BUCKET creato su Cloudflare con CORS configurato per APP_URL
[ ] CORS R2: Allow origins: [APP_URL], Allow methods: [GET, PUT], Max age: 86400
[ ] Resend: dominio verificato, EMAIL_FROM corretto
[ ] Vercel: tutte le env vars aggiunte nel dashboard
[ ] MongoDB Atlas: IP whitelist Vercel (o 0.0.0.0/0 per Vercel dynamic IPs)
[ ] Indici MongoDB creati (vedi docs/02-DATABASE.md sezione Indici)
[ ] Seed admin eseguito in produzione: npm run seed:admin
```

---

## 9. GUIDA DEPLOY VERCEL

```bash
# 1. Installa Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link progetto
vercel link

# 4. Imposta variabili d'ambiente
vercel env add NEXTAUTH_SECRET production
vercel env add MONGODB_URI production
# ... (tutte le variabili)

# 5. Deploy
vercel --prod
```

**Framework preset:** Next.js
**Build Command:** `npm run build`
**Output Directory:** `.next`
**Install Command:** `npm install`
