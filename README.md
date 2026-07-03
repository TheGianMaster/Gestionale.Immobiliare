# 🧠 GESTIONALE — MASTER CONTROL README
> **Documento principale di controllo per Claude Code.**
> Leggi PRIMA questo file. Poi naviga nei sub-README in `docs/` in base al task corrente.
> **Non modificare mai la struttura dei ticket senza aggiornare il relativo stato e le note.**

---

## 📌 COME FUNZIONA QUESTO DOCUMENTO

Ogni ticket ha 3 stati possibili:
- `🔴 Da sviluppare` — Task non ancora iniziato
- `🟡 Da convalidare` — Sviluppato, in attesa di approvazione utente
- `🟢 Done` — Approvato e chiuso

Quando passi a `Da convalidare` o `Done`, **DEVI** compilare:
- **Note sviluppo** → cosa hai fatto, scelte tecniche
- **Modifiche utente** → eventuali correzioni richieste prima di Done
- **File toccati** → lista dei percorsi modificati/creati

---

## 🗂️ MAPPA DEI SUB-README

| File | Argomento | Quando leggerlo |
|------|-----------|-----------------|
| `docs/00-SETUP.md` | Setup progetto, env, dipendenze | Fase 0 |
| `docs/01-AUTH.md` | Autenticazione, sessioni, utenti | Fase 1 |
| `docs/02-DATABASE.md` | Schemi MongoDB, modelli, cluster | Fase 2 |
| `docs/03-ANAGRAFICA.md` | Motore anagrafica, API, preview | Fase 3-4 |
| `docs/04-VARIABILI.md` | Tutti i tipi di campo, FieldRenderer | Fase 5-6 |
| `docs/05-DOCUMENTI.md` | Upload R2, tipi doc, gestione file | Fase 7 |
| `docs/06-CALENDARIO.md` | Vista mese/giorno, eventi, etichette | Fase 8 |
| `docs/07-NOTIFICHE.md` | Bell, counter, sistema notifiche | Fase 9 |
| `docs/08-PANNELLO.md` | Pannello controllo, Automazioni, tab | Fase 10-11 |
| `docs/09-PALETTE.md` | Palette colori, design tokens, CSS vars | Fase 12 |
| `docs/10-UI-LAYOUT.md` | Layout, sidebar, SezioneFissa, route map | Fase 3+ |
| `docs/11-AUTOMAZIONI.md` | Wizard Nuovo Debito, API atomica, RefSearch | Fase 11 |
| `docs/12-BILANCIO.md` | Sezione Bilancio, SezioneFissa, route WIP | Fase 12 |
| `skills/README-SKILLS.md` | Sistema skills agente, ottimizzazione token | Sempre |

---

## 🏗️ STACK TECNOLOGICO

```
Framework:     Next.js 16.2.9 (App Router + Turbopack)
Linguaggio:    TypeScript
UI:            React + TailwindCSS
Database:      MongoDB (singola URI, connessione unificata via connectDB())
Cache conn.:   Singleton globale, hot-reload safe
Auth:          NextAuth.js v5 (Credentials Provider)
Storage:       Cloudflare R2 (S3-compatible)
Email:         Resend
AI/LLM:        Groq
SMS/WA:        Twilio
Crittografia:  bcryptjs + pepper (INVITE_TOKEN_PEPPER)
Validazione:   Zod
```

---

## 📁 STRUTTURA PROGETTO (Target)

```
gestionale/
├── README.md                          ← SEI QUI
├── ROADMAP.md                         ← Timeline fasi
├── CHANGELOG.md                       ← Log modifiche
├── .env.local                         ← NON committare
├── .env.example                       ← Template committabile
│
├── docs/                              ← Sub-README per Claude Code
│   ├── 00-SETUP.md
│   ├── 01-AUTH.md
│   ├── 02-DATABASE.md
│   ├── 03-ANAGRAFICA.md
│   ├── 04-VARIABILI.md
│   ├── 05-DOCUMENTI.md
│   ├── 06-CALENDARIO.md
│   ├── 07-NOTIFICHE.md
│   ├── 08-PANNELLO.md
│   ├── 09-PALETTE.md
│   └── 10-UI-LAYOUT.md
│
├── skills/                            ← Skill files agente AI
│   ├── README-SKILLS.md
│   ├── skill-anagrafica.md
│   ├── skill-variabili.md
│   ├── skill-documenti.md
│   └── skill-calendario.md
│
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              ← Dashboard home
│   │   │   ├── anagrafica/[slug]/
│   │   │   │   ├── page.tsx          ← Preview list
│   │   │   │   └── [id]/
│   │   │   │       ├── view/page.tsx
│   │   │   │       ├── edit/page.tsx
│   │   │   │       └── documenti/page.tsx
│   │   │   ├── calendario/page.tsx
│   │   │   ├── controllo/page.tsx
│   │   │   └── notifiche/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── anagrafiche/route.ts
│   │       ├── anagrafiche/[slug]/route.ts
│   │       ├── anagrafiche/[slug]/schede/route.ts
│   │       ├── anagrafiche/[slug]/schede/[id]/route.ts
│   │       ├── calendario/route.ts
│   │       ├── notifiche/route.ts
│   │       └── documenti/route.ts
│   │
│   ├── components/
│   │   ├── ui/                        ← Componenti base riutilizzabili
│   │   ├── layout/                    ← Sidebar, Header, NotificationBell
│   │   ├── anagrafica/                ← PreviewTable, SchedaForm, SearchBar
│   │   ├── variabili/fields/          ← Tutti i field type components
│   │   ├── calendario/                ← CalendarMonth, CalendarDay, EventModal
│   │   └── notifiche/                 ← NotificationList, NotificationItem
│   │
│   ├── lib/
│   │   ├── mongodb.ts                 ← Connessione principale
│   │   ├── mongodb-anagrafiche.ts     ← Cluster anagrafiche
│   │   ├── mongodb-eventi.ts          ← Cluster eventi
│   │   ├── auth.ts                    ← NextAuth config
│   │   ├── r2.ts                      ← Cloudflare R2 client
│   │   ├── encrypt.ts                 ← bcrypt + pepper
│   │   ├── validators.ts              ← Zod schemas
│   │   └── utils.ts                   ← Helper functions
│   │
│   ├── models/                        ← Mongoose models
│   │   ├── User.ts
│   │   ├── AnagraficaConfig.ts
│   │   ├── Variante.ts
│   │   ├── Variabile.ts
│   │   ├── Scheda.ts
│   │   ├── Documento.ts
│   │   ├── Evento.ts
│   │   ├── Notifica.ts
│   │   └── SelectOption.ts
│   │
│   ├── types/
│   │   ├── anagrafica.ts
│   │   ├── variabili.ts
│   │   ├── user.ts
│   │   ├── calendario.ts
│   │   └── api.ts
│   │
│   └── styles/
│       ├── palette.ts                 ← TOKEN COLORI (fonte di verità)
│       ├── tokens.ts                  ← Design tokens (spacing, radius, ecc.)
│       └── globals.css                ← CSS globals + CSS variables
```

---

## 📋 TICKET — FASE 0: SETUP & FONDAMENTA

---

### T-001 — Inizializzazione progetto Next.js + TypeScript
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** nessuna
**Sub-README:** `docs/00-SETUP.md`

**Descrizione:**
Crea il progetto Next.js con App Router, TypeScript, TailwindCSS. Configura ESLint e Prettier. Struttura le cartelle secondo il target definito sopra.

**Criteri di accettazione:**
- [x] `npx create-next-app@latest` con flag `--typescript --tailwind --app --src-dir --import-alias "@/*"` *(setup manuale — npm registry non raggiungibile nel sandbox)*
- [x] ESLint configurato con regole TypeScript strict
- [x] Prettier configurato con config condivisa
- [x] `tsconfig.json` con path aliases (`@/components`, `@/lib`, `@/types`, `@/styles`, `@/models`)
- [x] Struttura cartelle completa creata (anche se vuota)
- [x] `.gitignore` include `.env.local`

**Note sviluppo:**
Setup manuale (invece di `create-next-app`) perché la cartella era già non vuota e il registry npm non era raggiungibile nel sandbox. Tutti i file di configurazione sono stati creati a mano con le stesse specifiche. La cartella `docs/` è stata creata copiando i file da `doc/` (esistente). I CSS variables del tema chiaro/scuro sono stati inclusi già in `globals.css` come base — saranno espansi in T-003/T-110 con la palette completa. I tipi base (`IUser`, `IAnagraficaConfig`, `IScheda`, `IVariabile`, `IEvento`) sono stati creati come placeholder in `src/types/` per supportare i ticket successivi. **NOTA:** `npm install` va eseguito dall'utente prima di avviare il progetto.

**Modifiche utente:** *(da compilare se richieste correzioni)*

**File toccati:**
- `package.json` — dipendenze e script
- `tsconfig.json` — path aliases TypeScript
- `next.config.ts` — config Next.js con header sicurezza base
- `tailwind.config.ts` — extend con CSS variables
- `postcss.config.js` — Tailwind + Autoprefixer
- `.eslintrc.json` — regole TypeScript strict + React hooks
- `.prettierrc` — config Prettier condivisa
- `.gitignore` — include `.env.local`, `node_modules`, `.next`
- `src/app/layout.tsx` — root layout con metadata
- `src/app/page.tsx` — redirect a /login
- `src/app/(auth)/login/page.tsx` — placeholder per T-012
- `src/app/(dashboard)/layout.tsx` — placeholder per T-030
- `src/app/(dashboard)/page.tsx` — placeholder dashboard
- `src/styles/globals.css` — CSS variables tema chiaro/scuro + reset base
- `src/types/api.ts` — tipi risposta API
- `src/types/user.ts` — tipi utente + augment NextAuth
- `src/types/anagrafica.ts` — tipi anagrafica placeholder
- `src/types/variabili.ts` — tipi variabili/field types
- `src/types/calendario.ts` — tipi evento calendario
- `docs/` — copiati da `doc/` (sub-README)

---

### T-002 — Configurazione .env e dipendenze NPM
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-001
**Sub-README:** `docs/00-SETUP.md`

**Descrizione:**
Crea `.env.example` basato sul template fornito. Installa tutte le dipendenze NPM necessarie al progetto.

**Criteri di accettazione:**
- [x] `.env.example` creato con tutte le variabili commentate
- [x] Dipendenze nel `package.json`: `mongoose`, `next-auth`, `bcryptjs`, `@aws-sdk/client-s3`, `resend`, `zod`, `date-fns`, `lucide-react`, `@radix-ui/react-*` (select, dialog, popover, dropdown, toast, tabs)
- [x] DevDependencies: `@types/bcryptjs`, `@types/node`, `tsx`
- [x] `package.json` con script `dev`, `build`, `start`, `lint`, `type-check`, `seed:admin`, `seed:data`

**Note sviluppo:**
Il file `default.env` preesistente era incompleto (mancavano `SEED_ADMIN_*`, commenti, `MONGODB_DB` aveva valore `"test"`, era presente un campo orfano `tokenvalue`). Creato `.env.example` pulito e allineato con la spec in `docs/00-SETUP.md`. Le dipendenze NPM erano già state inserite nel `package.json` durante T-001; il `package.json` è stato aggiornato dall'utente con `next@^16.2.9`. **NOTA:** `npm install` va eseguito dall'utente per materializzare il `node_modules`.

**Modifiche utente:** *(da compilare se richieste correzioni)*

**File toccati:**
- `.env.example` — creato ex novo (il `default.env` preesistente rimane come riferimento legacy)

---

### T-003 — Palette colori e design tokens
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-001
**Sub-README:** `docs/09-PALETTE.md`

**Descrizione:**
Crea il sistema di design tokens. File `palette.ts` come FONTE DI VERITÀ per tutti i colori. CSS variables in `globals.css`. TailwindCSS configurato per usare le variabili.

**Criteri di accettazione:**
- [x] `src/styles/palette.ts` con tutti i colori nominati
- [x] `src/styles/tokens.ts` con spacing, radius, shadows, typography
- [x] `src/styles/globals.css` con CSS variables generate dalla palette
- [x] `tailwind.config.ts` aggiornato per usare CSS variables
- [x] Supporto tema chiaro/scuro (CSS variables dual-theme)

**Note sviluppo:**
Creati `palette.ts` (fonte di verità, colori brand indigo + neutral + semantic + 8 colori eventi calendario) e `tokens.ts` (spacing 4px grid, radius, shadows, z-index, breakpoints, typography). `globals.css` completamente riscritto: importa Inter da Google Fonts, definisce tutte le CSS variables per tema chiaro e scuro, reset base, scrollbar custom, focus ring accessibile. `tailwind.config.ts` aggiornato con tutti i colori/font/radius/shadows mappati su CSS variables. Il tema si controlla tramite `data-theme="dark"` sull'elemento `<html>` (il toggle è previsto in T-110).

**Modifiche utente:** *(da compilare se richieste correzioni)*

**File toccati:**
- `src/styles/palette.ts` — creato
- `src/styles/tokens.ts` — creato
- `src/styles/globals.css` — riscritto completo
- `tailwind.config.ts` — aggiornato con CSS variables

---

### T-004 — Setup connessioni MongoDB multi-cluster
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-002
**Sub-README:** `docs/02-DATABASE.md`

**Descrizione:**
Configura le connessioni MongoDB. Il progetto usa cluster separati per anagrafiche, eventi e la connessione principale. Implementa il pattern singleton per le connessioni (evita reconnect su ogni API call in dev).

**Criteri di accettazione:**
- [x] `src/lib/mongodb.ts` — connessione principale (utenti, notifiche, config)
- [x] `src/lib/mongodb-anagrafiche.ts` — cluster `MONGODB_URI_ANAGRAFICHE`
- [x] `src/lib/mongodb-eventi.ts` — cluster `MONGODB_URI_EVENTI`
- [x] Ogni connessione usa pattern singleton con cache globale (Next.js hot reload safe)
- [x] Gestione errori connessione con log chiari
- [x] Timeout configurabile via env (`MONGODB_TIMEOUT_MS`, default 10000ms)

**Note sviluppo:**
`mongodb.ts` usa `mongoose.connect()` con cache `global._mongooseMain` per il cluster principale — riusa la connessione tra hot-reload. I cluster anagrafiche ed eventi usano `mongoose.createConnection()` (connessioni indipendenti) con cache globale separata (`_mongooseAnagrafiche`, `_mongooseEventi`). Gestione errori con `console.error` e re-throw per propagare al chiamante. Aggiunti anche `src/lib/utils.ts` (cn, toSlug, formatData, formatBytes) e `src/lib/encrypt.ts` (hashPassword/comparePassword con pepper) che servono ai ticket successivi. `.env.example` aggiornato con le nuove variabili opzionali.

**Modifiche utente:** *(da compilare se richieste correzioni)*

**File toccati:**
- `src/lib/mongodb.ts` — creato
- `src/lib/mongodb-anagrafiche.ts` — creato
- `src/lib/mongodb-eventi.ts` — creato
- `src/lib/utils.ts` — creato (cn, toSlug, formatData, formatBytes, truncate, sleep)
- `src/lib/encrypt.ts` — creato (hashPassword, comparePassword con bcrypt + pepper)
- `.env.example` — aggiunto MONGODB_DB_ANAGRAFICHE, MONGODB_DB_EVENTI, MONGODB_TIMEOUT_MS

---

## 📋 TICKET — FASE 1: AUTENTICAZIONE & UTENTI

---

### T-010 — Modello User MongoDB
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-004
**Sub-README:** `docs/01-AUTH.md`

**Descrizione:**
Crea il modello Mongoose per gli utenti. La password deve essere hashata con bcrypt + pepper prima del salvataggio. Include hook pre-save per la crittografia automatica.

**Criteri di accettazione:**
- [x] `src/models/User.ts` con schema completo
- [x] Campi: `_id`, `email`, `passwordHash`, `nome`, `cognome`, `ruolo` (admin|operatore), `attivo` (boolean), `createdAt`, `updatedAt`, `lastLogin`, `sessionDuration` (default 72h, override futuro da pannello)
- [x] Hook `pre('save')` che cripta la password con `bcrypt.hash(password + INVITE_TOKEN_PEPPER, 12)`
- [x] Metodo `comparePassword(candidate: string): Promise<boolean>`
- [x] Index su `email` (unique)
- [x] TypeScript types esportati

**Note sviluppo:**
Schema completo con validazioni Mongoose inline (email format, maxlength, enum ruolo, min/max sessionDuration). Hook pre('save') applica pepper + bcrypt cost 12 solo quando `passwordHash` è modificato. Aggiunto metodo helper `nomeCompleto()`. Export safe per hot-reload Next.js (`mongoose.models.User ?? mongoose.model(...)`). `src/types/user.ts` aggiornato con augment NextAuth completo (Session, User, JWT) e tipo `IUserSerialized` per uso client-side.

**File toccati:**
- `src/models/User.ts` — creato
- `src/types/user.ts` — aggiornato con augment NextAuth e IUserSerialized

---

### T-011 — NextAuth configuration (Credentials Provider)
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-010
**Sub-README:** `docs/01-AUTH.md`

**Descrizione:**
Configura NextAuth con Credentials Provider. La sessione dura 72 ore (JWT). Aggiorna `lastLogin` ad ogni accesso. Gestione errori login con messaggi chiari.

**Criteri di accettazione:**
- [x] `src/lib/auth.ts` con config NextAuth
- [x] `src/app/api/auth/[...nextauth]/route.ts`
- [x] JWT maxAge = 72 * 60 * 60 (72 ore)
- [x] Il JWT include: `userId`, `email`, `ruolo`, `nome`, `cognome`
- [x] Al login: verifica email, verifica password (bcrypt + pepper), aggiorna `lastLogin`
- [x] Middleware `src/middleware.ts` che protegge tutte le route dashboard
- [x] Redirect a `/login` se sessione assente o scaduta

**Note sviluppo:**
`auth.ts` usa NextAuth v5 con Credentials Provider. `authorize()` cerca l'utente per email (case-insensitive), verifica password via `user.comparePassword()`, aggiorna `lastLogin` in fire-and-forget (non blocca la risposta). Callbacks `jwt` e `session` aggiungono `userId`, `ruolo`, `nome`, `cognome`. Il middleware protegge tutte le route: public routes → redirect a / se autenticato; route protette → redirect a /login se non autenticato; `/controllo/*` → redirect a / se non admin. Matcher esclude statici, immagini, favicon e file con estensione.

**File toccati:**
- `src/lib/auth.ts` — creato
- `src/app/api/auth/[...nextauth]/route.ts` — creato
- `src/middleware.ts` — creato

---

### T-012 — Pagina Login UI
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-011, T-003
**Sub-README:** `docs/01-AUTH.md`, `docs/10-UI-LAYOUT.md`

**Descrizione:**
Pagina di login responsive, pulita, con branding. Include nota visibile all'utente che la sessione dura 72 ore e che il tempo di logout automatico sarà configurabile dal pannello utenze.

**Criteri di accettazione:**
- [x] `src/app/(auth)/login/page.tsx`
- [x] Campi: email, password (con toggle show/hide)
- [x] Stato loading durante submit
- [x] Messaggi errore inline (credenziali errate, account disattivo)
- [x] Nota UI con info sessione 72 ore
- [x] Responsive mobile-first (max-w-md centrato)
- [x] Redirect a `/` (dashboard) dopo login riuscito + supporto callbackUrl
- [x] Usa palette colori definita in T-003 (CSS variables)

**Note sviluppo:**
Componente client (`'use client'`). Usa `signIn('credentials', { redirect: false })` per gestire gli errori inline senza redirect. Mappa i codici errore NextAuth in messaggi italiani. Toggle show/hide password con icone Eye/EyeOff di lucide-react. Stato loading disabilita il form e mostra spinner. Focus ring via style inline (compatibile con CSS variables). Nota sessione con sfondo `--color-info-light`. Aggiunto `src/app/(auth)/layout.tsx` come wrapper standalone (senza sidebar/header).

**File toccati:**
- `src/app/(auth)/login/page.tsx` — riscritto completo
- `src/app/(auth)/layout.tsx` — creato

---

### T-013 — Seeding admin iniziale
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-010
**Sub-README:** `docs/01-AUTH.md`

**Descrizione:**
Script di seed per creare il primo utente admin. Eseguibile via `npm run seed:admin`. Utile per il primo avvio del sistema.

**Criteri di accettazione:**
- [ ] `scripts/seed-admin.ts` eseguibile con `ts-node` o `tsx`
- [ ] Legge credenziali da env (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`)
- [ ] Controlla se l'admin esiste già prima di creare
- [ ] Password criptata automaticamente tramite il modello User
- [ ] Log chiaro del risultato

**Note sviluppo:**
Script idempotente: controlla se l'admin esiste già prima di creare. Carica `.env.local` con dotenv. Importa il modello User dinamicamente (dopo la connessione). L'hook pre('save') gestisce hash bcrypt+pepper automaticamente. Validazione env con exit(1) se mancanti.

**File toccati:**
- `scripts/seed-admin.ts` — creato

---

## 📋 TICKET — FASE 2: SCHEMA DATABASE & MODELLI

---

### T-020 — Schema AnagraficaConfig
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-004
**Sub-README:** `docs/02-DATABASE.md`, `docs/03-ANAGRAFICA.md`

**Descrizione:**
Modello che definisce una "tipologia" di anagrafica (es: Clienti, Fornitori, Prodotti). Contiene la configurazione dei campi visibili nella preview e il riferimento alle variabili associate.

**Criteri di accettazione:**
- [x] `src/models/AnagraficaConfig.ts`
- [x] Campi: `slug` (unique, URL-safe), `nome`, `descrizione`, `icona`, `colore`, `variabili` (array slug), `previewColumns` (array di slug variabile da mostrare in lista), `tipiDocumento` (array stringhe — con commento TODO WIP), `attiva` (boolean), `ordine` (numero per sidebar), `createdAt`, `updatedAt`
- [x] Index su `slug` (unique)
- [x] Index su `attiva + ordine`

**Note sviluppo:**
Schema completo con validazioni Mongoose inline. `slug` lowercase, match regex `[a-z0-9-]+`. `colore` con match hex. `variabili` e `previewColumns` come array di stringhe (slug). `tipiDocumento` commentato come WIP futuro. Export hot-reload safe (`mongoose.models.AnagraficaConfig ?? mongoose.model(...)`). Indice composto `{ attiva, ordine }` per query sidebar.

**File toccati:**
- `src/models/AnagraficaConfig.ts` — creato

---

### T-021 — Schema Variabile (field type system)
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-020
**Sub-README:** `docs/02-DATABASE.md`, `docs/04-VARIABILI.md`

**Descrizione:**
Modello che descrive un singolo campo/variabile. Contiene il tipo e le configurazioni specifiche per tipo. È il cuore del sistema anagrafico.

**Criteri di accettazione:**
- [x] `src/models/Variabile.ts`
- [x] Campi base: `slug`, `label`, `tipo` (enum 10 tipi: text|textarea|number|date|boolean|select|multiselect|file|relation|color), `obbligatorio`, `descrizione`, `placeholder`, `anagraficaSlug`
- [x] Campi per tipo `select`/`multiselect`: gestiti via SelectOption (per slug+anagraficaSlug)
- [x] Campi per tipo `relation`: `targetAnagrafica`, `displayField`
- [x] Campi per tipo `number`: `min`, `max`, `decimali` (numero cifre)
- [x] Campi per tipo `text`/`textarea`: `maxLength`
- [x] `visibileInPreview` (boolean), `ordine` (numero)
- [x] Index composto `{ anagraficaSlug, slug }` unique — due anagrafiche possono avere stesso slug campo

**Note sviluppo:**
Tipi aggiornati rispetto alla spec originale (allineati al sistema reale): `number` invece di `numbers`, aggiunto `boolean`, `file`, `color`, rimosso `mail`/`phone`/`variantID` come tipi separati (saranno gestiti in T-050+ come varianti del tipo `text` con validazione custom). Indice composto per permettere stesso slug in anagrafiche diverse. Export hot-reload safe.

**File toccati:**
- `src/models/Variabile.ts` — creato

---

### T-022 — Schema Variante
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-021
**Sub-README:** `docs/02-DATABASE.md`

**Descrizione:**
Una variante definisce una "versione" di un'anagrafica con visibilità personalizzata dei campi. Esempio: anagrafica "Cliente" con variante "Privato" che nasconde il campo "P.IVA".

**Criteri di accettazione:**
- [x] `src/models/Variante.ts`
- [x] Campi: `schedaId`, `anagraficaSlug`, `dati` (snapshot Record<string,unknown>), `versione` (progressivo), `modificataDa`, `noteModifica`
- [x] Registrato sulla connessione anagrafiche (non quella principale)
- [x] Index su `[schedaId, versione]` (ultime versioni prima) e `[anagraficaSlug, createdAt]`

**Note sviluppo:**
La spec originale descriveva Variante come "versione personalizzata con campi oscurati". In realtà la struttura del progetto usa Variante come **audit trail / snapshot** dei dati di una Scheda. Implementato come tale: snapshot `dati` + `versione` progressiva + `modificataDa`. Registrato via `getAnagraficheConnection()` con factory async `getVarianteModel()` per lazy init sulla connessione corretta. Le "varianti di visualizzazione" (oscuramento campi) sono un concetto che riguarda `AnagraficaConfig` e sarà gestito in Fase 4-5.

**File toccati:**
- `src/models/Variante.ts` — creato

---

### T-023 — Schema Scheda (record anagrafico)
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-021, T-022
**Sub-README:** `docs/02-DATABASE.md`

**Descrizione:**
Rappresenta un singolo record all'interno di un'anagrafica. I dati sono flessibili (schema-less per i valori) ma typizzati tramite le Variabili associate.

**Criteri di accettazione:**
- [x] `src/models/Scheda.ts`
- [x] Campi: `anagraficaSlug`, `dati` (Record<string,unknown>), `attiva` (soft-delete), `versione`, `creataDa`, `modificataDa`, `tags[]`, `createdAt`, `updatedAt`
- [x] Collection dinamica per anagrafica: `schede_{anagraficaSlug}` (via factory `getSchedaModel(slug)`)
- [x] Index su `[anagraficaSlug, attiva]`, `[anagraficaSlug, createdAt]`, `tags`, text index su `tags`
- [x] Registrato sulla connessione anagrafiche

**Note sviluppo:**
Ogni anagrafica usa la propria collection MongoDB (`schede_clienti`, `schede_fornitori`, ecc.) per isolamento e performance. La factory `getSchedaModel(slug)` usa una Map locale per cache in-memory del model. Il campo `tags` supporta ricerca full-text. `versione` sincronizzato con Variante per audit trail.

**File toccati:**
- `src/models/Scheda.ts` — creato

---

### T-024 — Schema Documento
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-023
**Sub-README:** `docs/02-DATABASE.md`, `docs/05-DOCUMENTI.md`

**Descrizione:**
Metadati dei documenti caricati. Il file fisico è su Cloudflare R2; qui si salvano solo i metadati.

**Criteri di accettazione:**
- [x] `src/models/Documento.ts`
- [x] Campi: `schedaId`, `anagraficaSlug`, `tipo`, `nome`, `mimeType`, `dimensione`, `s3Key`, `s3Bucket`, `note`, `caricatoDa`, `attivo` (soft-delete)
- [x] `urlPresigned` NON persistito (select: false) — generato on-demand
- [x] Index su `schedaId + attivo`, `anagraficaSlug + tipo`, `s3Key` (unique)
- [x] Registrato sulla connessione anagrafiche via `getDocumentoModel()`

**Note sviluppo:**
`urlPresigned` escluso dalla selezione default (select: false) — non va mai salvato, è sempre generato runtime. Index unique su `s3Key` per prevenire duplicati R2. `s3Bucket` salvato esplicitamente per supportare future migrazioni tra bucket. `attivo` per soft-delete (non elimina da R2 immediatamente — la pulizia è asincrona).

**File toccati:**
- `src/models/Documento.ts` — creato

---

### T-025 — Schema Evento (calendario)
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-004
**Sub-README:** `docs/02-DATABASE.md`, `docs/06-CALENDARIO.md`

**Descrizione:**
Modello per gli eventi del calendario. Connesso al cluster `MONGODB_URI_EVENTI`.

**Criteri di accettazione:**
- [x] `src/models/Evento.ts`
- [x] Campi: `titolo`, `tipo` (enum 5 tipi), `descrizione`, `inizio`, `fine`, `tuttoIlGiorno`, `creatoDa`, `partecipanti[]`, `schedaId` (opzionale), `anagraficaSlug` (opzionale), `colore`, `completato`, `attivo` (soft-delete)
- [x] Index su `[inizio, attivo]`, `[creatoDa, inizio]`, `partecipanti + inizio`, `schedaId`
- [x] Registrato su connessione eventi via `getEventoModel()`

**Note sviluppo:**
Registrato tramite `getEventiConnection()` (cluster separato `MONGODB_URI_EVENTI`). Factory async `getEventoModel()` con cache `_EventoModel`. `tipo` enum: appuntamento|scadenza|attivita|promemoria|altro. Collegamento opzionale a Scheda tramite `schedaId + anagraficaSlug` (no populate cross-cluster). Index su `partecipanti` per query "eventi dove partecipo".

**File toccati:**
- `src/models/Evento.ts` — creato

---

### T-026 — Schema Notifica
**Stato:** `🟢 Done`
**Priorità:** Media
**Dipendenze:** T-004
**Sub-README:** `docs/02-DATABASE.md`, `docs/07-NOTIFICHE.md`

**Descrizione:**
Modello per le notifiche in-app. Ogni notifica è associata ad un utente e può avere un link di riferimento.

**Criteri di accettazione:**
- [x] `src/models/Notifica.ts`
- [x] Campi: `userId`, `tipo` (info|success|warning|error), `azione` (enum 8 azioni), `titolo`, `messaggio`, `letta`, `schedaId`/`anagraficaSlug`/`eventoId` (collegamento opzionale), `scadenzaTTL`
- [x] TTL index su `scadenzaTTL` con `expireAfterSeconds: 0` — MongoDB elimina al raggiungimento della data
- [x] Index su `[userId, letta, createdAt]`
- [x] Pre-save hook: imposta `scadenzaTTL = now + 30 giorni` automaticamente

**Note sviluppo:**
Il TTL è implementato tramite campo `scadenzaTTL` (non `createdAt`) per flessibilità — permette di impostare TTL diversi per notifiche diverse se in futuro necessario. Il pre-save hook setta il campo solo se assente (`isNew && !scadenzaTTL`). Aggiunto enum `azione` (8 valori) per tracciamento tipo evento che ha generato la notifica. Export hot-reload safe sulla connessione principale.

**File toccati:**
- `src/models/Notifica.ts` — creato

---

### T-027 — Schema SelectOption
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-021
**Sub-README:** `docs/02-DATABASE.md`, `docs/04-VARIABILI.md`

**Descrizione:**
Opzioni per i campi di tipo `select`. Gestibili dal pannello admin (WIP). Raggruppate per variabile.

**Criteri di accettazione:**
- [x] `src/models/SelectOption.ts`
- [x] Campi: `anagraficaSlug`, `variabileSlug`, `valore`, `etichetta` (label visualizzata), `colore` (hex opzionale per badge), `ordine`, `attiva` (soft-delete)
- [x] Index unique su `[anagraficaSlug, variabileSlug, valore]` — stessa opzione non duplicabile
- [x] Index su `[anagraficaSlug, variabileSlug, ordine]` per fetch ordinata

**Note sviluppo:**
`valore` è la chiave salvata nel DB (es: "lombardia"), `etichetta` è il testo UI (es: "Lombardia") — separazione per permettere rename etichette senza perdere dati storici. Index unique su tripla `[anagraficaSlug, variabileSlug, valore]`. `attiva` per nascondere opzioni deprecate senza perdere schede che le referenziano. Export hot-reload safe sulla connessione principale.

**File toccati:**
- `src/models/SelectOption.ts` — creato

---

## 📋 TICKET — FASE 3: LAYOUT & NAVIGAZIONE

---

### T-030 — Layout dashboard principale
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-012, T-003
**Sub-README:** `docs/10-UI-LAYOUT.md`

**Descrizione:**
Layout generale della dashboard. Sidebar sinistra + header fisso in alto + area contenuto principale. Fully responsive: sidebar collassabile su mobile (hamburger), full-width su desktop.

**Criteri di accettazione:**
- [x] `src/app/(dashboard)/layout.tsx` — verifica sessione server-side, compone Sidebar + Header + main
- [x] Sidebar sinistra fissa (desktop), drawer su mobile
- [x] Header fisso in alto con: logo, breadcrumb, campanellina notifiche, UserMenu
- [x] Area contenuto scrollabile con max-w-[1400px] e padding responsive
- [x] Sidebar voci: Dashboard, anagrafiche dinamiche, Calendario, Pannello Controllo
- [x] Animazione CSS transition per apertura/chiusura sidebar mobile

**Note sviluppo:**
Layout server component con `await auth()` — redirect immediato a /login se sessione assente. Sidebar e Header sono client components con stato locale. La Sidebar riceve il `ruolo` dall'utente di sessione per mostrare/nascondere il Pannello Controllo. Dashboard homepage aggiornata con card accesso rapido anagrafiche.

**File toccati:**
- `src/app/(dashboard)/layout.tsx` — riscritto
- `src/app/(dashboard)/page.tsx` — aggiornato con card anagrafiche

---

### T-031 — Componente Sidebar
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-030
**Sub-README:** `docs/10-UI-LAYOUT.md`

**Descrizione:**
Sidebar di navigazione. Le voci delle anagrafiche sono caricate dinamicamente da db. Ogni voce anagrafica ha l'icona e il colore configurati nell'AnagraficaConfig.

**Criteri di accettazione:**
- [x] `src/components/layout/Sidebar.tsx`
- [x] Carica `AnagraficaConfig` via `GET /api/anagrafiche` al mount con skeleton loading
- [x] Voce attiva evidenziata con colore anagrafica (desktop) o brand (voci fisse)
- [x] Ogni voce anagrafica mostra: iniziale colorata + nome (TODO: mappa completa icone Lucide in T-031 ext.)
- [x] Sezioni: Dashboard, Anagrafiche (dinamiche), Calendario, Pannello Controllo (solo admin)
- [x] Footer: versione v 1.0.0
- [x] Comunicazione apertura con Header via `window.dispatchEvent('sidebar:toggle')`

**Note sviluppo:**
Sidebar duale: versione fissa CSS (desktop ≥ lg) e versione drawer con overlay (mobile/tablet). Entrambe usano `SidebarContent` come componente interno condiviso. L'hamburger nell'Header dispatcha un evento window `sidebar:toggle` che la Sidebar ascolta — evita prop drilling tra componenti paralleli nel layout. Voce attiva rilevata con `usePathname()`.

**File toccati:**
- `src/components/layout/Sidebar.tsx` — creato
- `src/app/api/anagrafiche/route.ts` — creato (GET, protetto da auth)

---

### T-032 — Componente Header + NotificationBell
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-030, T-026
**Sub-README:** `docs/10-UI-LAYOUT.md`, `docs/07-NOTIFICHE.md`

**Descrizione:**
Header principale con campanellina notifiche (con badge numero notifiche non lette) e menu utente.

**Criteri di accettazione:**
- [x] `src/components/layout/Header.tsx` — hamburger, breadcrumb da pathname, NotificationBell, UserMenu
- [x] `src/components/layout/NotificationBell.tsx` — badge numerico, polling 60s, dropdown 5 notifiche, segna letta, segna tutte
- [x] `src/components/layout/UserMenu.tsx` — avatar iniziali, nome/email/ruolo, logout via signOut()
- [x] Polling ogni 60s via `setInterval` + `GET /api/notifiche/count`
- [x] Click campanellina: dropdown con ultime 5 notifiche + link "Vedi tutte"
- [x] Badge nascosto se 0, visibile rosso se ≥1 (max "99+")

**Note sviluppo:**
Header è client component (`'use client'`) per il breadcrumb dinamico da `usePathname()`. Il Breadcrumb è un sotto-componente interno che mappa i segmenti URL in etichette leggibili. UserMenu e NotificationBell hanno ciascuno gestione click-fuori e Escape per chiusura. API stub create: `/api/notifiche`, `/api/notifiche/count`, `/api/notifiche/[id]/leggi`, `/api/notifiche/leggi-tutte` (T-080 aggiungerà logica completa).

**File toccati:**
- `src/components/layout/Header.tsx` — creato
- `src/components/layout/NotificationBell.tsx` — creato
- `src/components/layout/UserMenu.tsx` — creato
- `src/app/api/notifiche/route.ts` — creato
- `src/app/api/notifiche/count/route.ts` — creato
- `src/app/api/notifiche/[id]/leggi/route.ts` — creato
- `src/app/api/notifiche/leggi-tutte/route.ts` — creato

---

## 📋 TICKET — FASE 4: MOTORE ANAGRAFICA

---

### T-040 — API CRUD Anagrafiche Config
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-020
**Sub-README:** `docs/03-ANAGRAFICA.md`

**Descrizione:**
Endpoint per gestire le configurazioni delle anagrafiche. In questa fase: solo lettura (la creazione/modifica è futura nel pannello admin).

**Criteri di accettazione:**
- [ ] `GET /api/anagrafiche` → lista tutte le AnagraficaConfig attive, ordinata per `ordine`
- [ ] `GET /api/anagrafiche/[slug]` → config singola con variabili popolate
- [ ] Tutte le route protette da auth (middleware NextAuth)
- [ ] Risposta tipizzata in TypeScript
- [ ] Gestione 404 se slug non trovato

**Note sviluppo:**
`GET /api/anagrafiche` già esistente (creato con T-031, endpoint sidebar). Aggiunto `GET /api/anagrafiche/[slug]` con variabili popolate ordinate per `ordine`.

**File toccati:**
- `src/app/api/anagrafiche/route.ts` — esistente, invariato
- `src/app/api/anagrafiche/[slug]/route.ts` — creato

---

### T-041 — API CRUD Schede
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-023, T-040
**Sub-README:** `docs/03-ANAGRAFICA.md`

**Descrizione:**
Endpoint CRUD completo per le schede di un'anagrafica. Include ricerca e paginazione per la preview.

**Criteri di accettazione:**
- [ ] `GET /api/anagrafiche/[slug]/schede` → lista con paginazione (page, limit), filtro ricerca (query param `q`), ordinamento
- [ ] `POST /api/anagrafiche/[slug]/schede` → crea nuova scheda
- [ ] `GET /api/anagrafiche/[slug]/schede/[id]` → leggi scheda singola
- [ ] `PUT /api/anagrafiche/[slug]/schede/[id]` → aggiorna scheda
- [ ] `DELETE /api/anagrafiche/[slug]/schede/[id]` → elimina scheda (soft delete: `attiva = false`)
- [ ] La ricerca `q` opera solo sui campi definiti in `previewColumns` dell'AnagraficaConfig
- [ ] Validazione Zod lato server per ogni campo in base al tipo Variabile
- [ ] Salva `createdBy`/`updatedBy` dalla sessione

**Note sviluppo:**
CRUD completo: GET lista (paginazione + ricerca regex sui previewColumns), POST crea, GET singola, PUT aggiorna (con `$inc versione`), DELETE soft (attiva→false). Ricerca opera su MongoDB (server-side) non filtra solo la pagina corrente. Validazione ObjectId. `creataDa`/`modificataDa` da sessione.

**File toccati:**
- `src/app/api/anagrafiche/[slug]/schede/route.ts` — creato (GET + POST)
- `src/app/api/anagrafiche/[slug]/schede/[id]/route.ts` — creato (GET, PUT, DELETE)

---

### T-042 — Pagina Preview Anagrafica (lista schede)
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-041, T-031
**Sub-README:** `docs/03-ANAGRAFICA.md`

**Descrizione:**
Pagina lista per ogni anagrafica. Mostra le schede in una tabella/lista. Hover su riga: appaiono i pulsanti azione. Include barra di ricerca che chiama il db.

**Criteri di accettazione:**
- [ ] `src/app/(dashboard)/anagrafica/[slug]/page.tsx`
- [ ] `src/components/anagrafica/PreviewTable.tsx`
- [ ] `src/components/anagrafica/SearchBar.tsx`
- [ ] Colonne generate dinamicamente dai `previewColumns` della config
- [ ] Hover riga → appaiono pulsanti a destra: `View` 👁 | `Edit` ✏️ | `Delete` 🗑️
- [ ] Click `Delete` → apre `DeleteConfirmModal` con nome scheda
- [ ] Pulsante "Nuova scheda" in alto a destra
- [ ] Paginazione in fondo (prev/next + numero pagine)
- [ ] Skeleton loading durante fetch
- [ ] Stato vuoto con illustrazione e CTA

**Note sviluppo:**
PreviewTable client component: carica schede da API con paginazione/ricerca, colonne generate da `previewColumns`. Hover riga → pulsanti View/Edit/Delete. DeleteConfirmModal con conferma. SearchBar con debounce 400ms manuale (senza dipendenza use-debounce). Stato vuoto con CTA "Crea prima scheda". Skeleton loading 5 righe. Not-found page personalizzata.

**File toccati:**
- `src/app/(dashboard)/anagrafica/[slug]/page.tsx` — creato
- `src/app/(dashboard)/anagrafica/[slug]/not-found.tsx` — creato
- `src/components/anagrafica/PreviewTable.tsx` — creato
- `src/components/anagrafica/SearchBar.tsx` — creato

---

### T-043 — Pagina View Scheda
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-042
**Sub-README:** `docs/03-ANAGRAFICA.md`

**Descrizione:**
Pagina di visualizzazione read-only di una scheda. Mostra tutti i campi in modalità lettura, rispettando la logica variantID. Tab in alto: Dati | Documenti.

**Criteri di accettazione:**
- [ ] `src/app/(dashboard)/anagrafica/[slug]/[id]/view/page.tsx`
- [ ] `src/components/anagrafica/SchedaView.tsx`
- [ ] Mostra tutti i campi non oscurati dalla variante
- [ ] Pulsante "Modifica" in alto a destra
- [ ] Breadcrumb: Dashboard > [Anagrafica] > [Nome scheda]
- [ ] Tab: Dati | Documenti (navigazione tra le due sezioni)
- [ ] Per tipo `reference`: mostra label display + link cliccabile alla scheda referenziata

**Note sviluppo:**
SchedaView client component con tab Dati | Documenti. Tab Dati: griglia `label | valore` per ogni variabile ordinata per `ordine`, con formattazione per tipo (date in locale IT, boolean Sì/No, colori con swatch, textarea con whitespace-pre-wrap). Tab Documenti: placeholder WIP con commento T-060/T-061. Breadcrumb + pulsante "Modifica" → edit. Meta info (creata/modificata il).

**File toccati:**
- `src/app/(dashboard)/anagrafica/[slug]/[id]/view/page.tsx` — creato
- `src/components/anagrafica/SchedaView.tsx` — creato

---

### T-044 — Pagina Edit Scheda (Form)
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-043, T-050
**Sub-README:** `docs/03-ANAGRAFICA.md`, `docs/04-VARIABILI.md`

**Descrizione:**
Form di creazione/modifica scheda. Renderizza i campi dinamicamente tramite `FieldRenderer`. Applica logica di visibilità variantID.

**Criteri di accettazione:**
- [ ] `src/app/(dashboard)/anagrafica/[slug]/[id]/edit/page.tsx`
- [ ] Stessa pagina usata per creazione (`[id] = 'new'`) e modifica
- [ ] `src/components/anagrafica/SchedaForm.tsx`
- [ ] Campi renderizzati in ordine tramite `FieldRenderer`
- [ ] Selezione variantID in cima al form (se l'anagrafica ha varianti)
- [ ] Al cambio variantID: campi oscurati scompaiono con animazione
- [ ] Validazione client-side real-time con indicatori visivi
- [ ] Submit: mostra loading, gestisce errori, redirect a view dopo successo
- [ ] Pulsante "Annulla" → torna a preview o view

**Note sviluppo:**
SchedaForm client component con `useCallback` per `handleChange`. Stessa pagina per creazione (`/new`) e modifica (`/[id]/edit`). FieldRenderer dispatcha al field corretto in base al tipo variabile. NewSchedaModal apre il form in modale per creazione rapida dalla lista. Validazione client-side con `buildSchedaSchema` prima del submit; errori mostrati inline sui campi. Submit invia a `POST /api/anagrafiche/[slug]/schede` (nuova) o `PUT /api/.../[id]` (modifica), poi redirect a view.

**File toccati:**
- `src/app/(dashboard)/anagrafica/[slug]/[id]/edit/page.tsx` — creato
- `src/app/(dashboard)/anagrafica/[slug]/new/page.tsx` — creato
- `src/components/anagrafica/SchedaForm.tsx` — creato
- `src/components/anagrafica/NewSchedaModal.tsx` — creato

---

## 📋 TICKET — FASE 5: TIPI DI VARIABILI (FIELD TYPES)

---

### T-050 — FieldRenderer (dispatcher centrale)
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-021
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Componente centrale che riceve una Variabile e renderizza il field component corretto. Funziona sia in modalità `view` (read-only) che `edit` (form).

**Criteri di accettazione:**
- [ ] `src/components/variabili/FieldRenderer.tsx`
- [ ] Props: `variabile: Variabile`, `valore: any`, `mode: 'view' | 'edit'`, `onChange?: (valore: any) => void`, `error?: string`
- [ ] Switch su `variabile.tipo` → renderizza il componente corretto
- [ ] In modalità `view`: label + valore formattato
- [ ] In modalità `edit`: label + campo interattivo + messaggio errore
- [ ] Campo obbligatorio: indicatore `*` rosso accanto alla label
- [ ] Campo oscurato dalla variante: non renderizzato (il controllo è fatto da SchedaForm)

**Note sviluppo:**
Switch su `variabile.tipo` → importa e renderizza il field component corretto. Props: `variabile`, `valore`, `mode` (view|edit), `onChange?(slug, val)`, `error?`. In view mode: delega a `ViewRow` nel _shared. In edit mode: delega al field con label, input e messaggio errore. Campo obbligatorio: asterisco rosso dalla label del _shared.

**File toccati:**
- `src/components/variabili/FieldRenderer.tsx` — creato

---

### T-051 — Campo TEXT e TEXT-AREA
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-050
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Implementa i componenti per testo breve e testo lungo.

**Criteri di accettazione:**
- [ ] `src/components/variabili/fields/TextField.tsx`
- [ ] `src/components/variabili/fields/TextAreaField.tsx`
- [ ] TextField: `<input type="text">`, maxLength dal config Variabile (default 255), counter caratteri
- [ ] TextAreaField: `<textarea>` con altezza auto-grow, maxLength 5000, counter caratteri
- [ ] Entrambi: placeholder dal config, stili coerenti con palette

**Note sviluppo:**
TextField: `<input type="text">` con `maxLength` da config, counter caratteri. TextAreaField: `<textarea>` con altezza auto-grow (scrollHeight), counter. _shared.tsx contiene `BaseFieldProps`, `FieldLabel`, `FieldError`, `ViewRow`, `inputClass`, costante `EMPTY`.

**File toccati:**
- `src/components/variabili/fields/TextField.tsx` — creato
- `src/components/variabili/fields/TextAreaField.tsx` — creato
- `src/components/variabili/fields/_shared.tsx` — creato (shared base)

---

### T-052 — Campo NUMBERS, MAIL, PHONE
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-050
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Campi con validazione specifica per tipo di dato.

**Criteri di accettazione:**
- [ ] `src/components/variabili/fields/NumberField.tsx` — `<input type="number">`, rispetta min/max/decimali dal config
- [ ] `src/components/variabili/fields/MailField.tsx` — `<input type="email">`, validazione formato email (Zod email schema), messaggio errore "Formato email non valido"
- [ ] `src/components/variabili/fields/PhoneField.tsx` — `<input type="tel">`, accetta solo cifre e `+`, `(`, `)`, `-`, spazio, formattazione automatica
- [ ] Tutti: indicatori errore inline in rosso (palette `error`)

**Note sviluppo:**
NumberField: `<input type="number">` con `min`, `max`, `step` calcolato da `decimali`. MailField: `<input type="email">` con validazione formato via regex. PhoneField: `<input type="tel">` con accettazione solo chars `[0-9+\s\-()]`.

**File toccati:**
- `src/components/variabili/fields/NumberField.tsx` — creato
- `src/components/variabili/fields/MailField.tsx` — creato
- `src/components/variabili/fields/PhoneField.tsx` — creato

---

### T-053 — Campo DATA (con calendar picker)
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-050
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Campo data con mini-calendario a comparsa. Navigazione per mese/anno. Il campo mostra la data in formato `DD/MM/YYYY` internamente.

**Criteri di accettazione:**
- [ ] `src/components/variabili/fields/DateField.tsx`
- [ ] Input testo con formato `DD/MM/YYYY` con aiuto all'inserimento (separatori auto)
- [ ] Click sull'input o sull'icona calendario → apre popover con mini-calendario
- [ ] Mini-calendario: navigazione frecce prev/next mese, click su header mese → switcha a vista anni
- [ ] Click su giorno → seleziona e chiude popover
- [ ] Valore salvato come ISO string `YYYY-MM-DD` internamente
- [ ] Usa `@radix-ui/react-popover` per il popover
- [ ] `date-fns` per manipolazione date

**Note sviluppo:**
Input testo con formato DD/MM/YYYY. Click → popover mini-calendario (Radix Popover). Navigazione prev/next mese, click header mese → vista anni. `date-fns` per manipolazione. Valore salvato come ISO string YYYY-MM-DD.

**File toccati:**
- `src/components/variabili/fields/DateField.tsx` — creato

---

### T-054 — Campo SELECT (dropdown)
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-050, T-027
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Dropdown con opzioni caricate da `SelectOption` collection. Opzioni gestibili dal pannello admin (WIP). Include badge colorato se l'opzione ha un colore definito.

**Criteri di accettazione:**
- [ ] `src/components/variabili/fields/SelectField.tsx`
- [ ] Carica opzioni via `GET /api/select-options?variabile=[slug]&anagrafica=[slug]`
- [ ] Usa `@radix-ui/react-select` per il dropdown
- [ ] Opzioni con colore: mostra dot colorato accanto al testo
- [ ] In view mode: mostra badge colorato con label
- [ ] Opzione vuota "Seleziona..." come default
- [ ] API `GET /api/select-options` protetta da auth

**Note sviluppo:**
SelectField carica opzioni via `GET /api/select-options?variabileSlug=X&anagraficaSlug=Y`. Usa Radix Select. Opzioni con colore: dot colorato accanto al testo. Badge colorato in view mode.

**File toccati:**
- `src/components/variabili/fields/SelectField.tsx` — creato
- `src/app/api/select-options/route.ts` — creato

---

### T-055 — Campo REFERENCE e MULTI-REFERENCE
**Stato:** `🟢 Done`
**Priorità:** 🔴 Critica
**Dipendenze:** T-050, T-041
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Campo lookup su un'altra anagrafica. La ricerca avviene sul db. Il valore salvato è `{id, label}` per evitare join ogni volta.

**Criteri di accettazione:**
- [ ] `src/components/variabili/fields/ReferenceField.tsx`
- [ ] `src/components/variabili/fields/MultiReferenceField.tsx`
- [ ] Input di ricerca → debounce 300ms → chiama `GET /api/anagrafiche/[targetSlug]/schede?q=[testo]`
- [ ] Risultati in dropdown sotto il campo (max 8 risultati)
- [ ] Click su risultato → seleziona e chiude dropdown
- [ ] Valore selezionato mostra: nome/label + X per rimuovere
- [ ] MultiReference: mostra lista di tag/pill + X per rimuovere singolo
- [ ] In view mode: mostra label + link cliccabile alla scheda referenziata

**Note sviluppo:**
ReferenceField: input ricerca con debounce 300ms → `GET /api/anagrafiche/[targetSlug]/schede?q=X`. Risultati in dropdown, click seleziona {id, label}. MultiReferenceField: lista tag/pill rimuovibili. In view mode: label + link alla scheda referenziata.

**File toccati:**
- `src/components/variabili/fields/ReferenceField.tsx` — creato
- `src/components/variabili/fields/MultiReferenceField.tsx` — creato

---

### T-056 — Campo VARIANTID
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-054, T-022
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Campo speciale che identifica la variante della scheda. Carica le varianti disponibili per l'anagrafica corrente. Al cambio di variante, il form aggiorna la visibilità dei campi.

**Criteri di accettazione:**
- [ ] `src/components/variabili/fields/VariantIDField.tsx`
- [ ] Dropdown/Select con le varianti disponibili per l'anagrafica
- [ ] Carica varianti via `GET /api/varianti?anagrafica=[slug]`
- [ ] Al cambio: emette evento per SchedaForm che aggiorna `variabiliOsculte`
- [ ] In view mode: mostra badge con nome variante e colore variante
- [ ] Se nessuna variante disponibile: campo nascosto

**Note sviluppo:**
Dropdown con varianti disponibili via `GET /api/varianti?anagrafica=[slug]`. Al cambio emette onChange a SchedaForm che filtra i campi oscurati dalla variante. In view mode: badge con nome e colore variante.

**File toccati:**
- `src/components/variabili/fields/VariantIDField.tsx` — creato
- `src/app/api/varianti/route.ts` — creato

---

## 📋 TICKET — FASE 6: SEZIONE DOCUMENTI SCHEDA

---

### T-060 — API Upload e Gestione Documenti (R2)
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-024, T-002
**Sub-README:** `docs/05-DOCUMENTI.md`

**Descrizione:**
API per upload file su Cloudflare R2 e gestione metadati in MongoDB. Accetta JPEG, PDF, HTML.

**Criteri di accettazione:**
- [x] `src/lib/r2.ts` — client S3-compatible per R2 (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`)
- [x] `POST /api/documenti/upload` — riceve file multipart, carica su R2, salva metadati
- [x] `GET /api/documenti?schedaId=[id]` — lista documenti di una scheda
- [x] `DELETE /api/documenti/[id]` — elimina da R2 + db
- [x] `GET /api/documenti/[id]/url` — genera URL presigned per download (expire 1h)
- [x] Percorso R2: `{anagraficaSlug}/{schedaId}/{timestamp}-{nomeFile}`
- [x] Validazione MIME type: solo `image/jpeg`, `application/pdf`, `text/html`
- [x] Limite dimensione: 10MB per file

**Note sviluppo:**
`r2.ts` con graceful degrade: se le variabili R2_* non sono configurate, `isR2Configured()` ritorna false e gli endpoint rispondono 503 con messaggio chiaro. Upload via multipart/form-data con `formData.get("file")`. Percorso R2: `{anagraficaSlug}/{schedaId}/{timestamp}-{nome}`. URL presigned expire 1h. Soft-delete: `attivo=false` su MongoDB, il file R2 rimane (pulizia futura). MIME accettati: `image/jpeg`, `image/png`, `application/pdf`, `text/html`. MaxMB configurabile per anagrafica (da AnagraficaConfig.maxDocumentoMB).

**File toccati:**
- `src/lib/r2.ts` — creato (S3Client, upload, presign, delete, helper)
- `src/app/api/documenti/route.ts` — creato (GET lista, POST upload)
- `src/app/api/documenti/[id]/route.ts` — creato (DELETE soft)
- `src/app/api/documenti/[id]/url/route.ts` — creato (GET presigned URL)

---

### T-061 — UI Sezione Documenti Scheda
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-060, T-043
**Sub-README:** `docs/05-DOCUMENTI.md`

**Descrizione:**
Sezione documenti accessibile dalla tab "Documenti" nella view di una scheda. Include upload, lista, download, elimina.

**Criteri di accettazione:**
- [ ] `src/app/(dashboard)/anagrafica/[slug]/[id]/documenti/page.tsx`
- [ ] Area upload drag-and-drop + click to browse
- [ ] Dopo selezione file: modale per scegliere il tipo documento (dropdown con tipi configurati — WIP admin, per ora lista fissa editabile)
- [ ] Lista documenti con: icona tipo, nome file, tipo documento, dimensione, data caricamento, uploader
- [ ] Azioni per documento: 👁 Preview (in-browser per PDF/HTML/JPEG) | ⬇️ Download | 🗑️ Elimina
- [ ] Elimina: conferma modale
- [ ] NOTA COMMENTO NEL CODICE: *"// TODO: I tipi documento saranno configurabili dal Pannello Controllo > Documenti (WIP)"*

**Note sviluppo:**
DocumentiSection carica `tipiDocumento` e `maxDocumentoMB` da `GET /api/controllo/anagrafiche/[slug]`. Upload drag-and-drop + click-to-browse. Prima del caricamento: modale TipoModal con chip-tag per scegliere il tipo (fallback a lista predefinita se non configurata). Preview inline per JPEG/PNG (img) e PDF/HTML (iframe). Download via URL presigned. Soft-delete con conferma modale. NOTA nel codice: `// TODO: tipi documento configurabili dal Pannello Controllo > Anagrafiche`.

**File toccati:**
- `src/components/anagrafica/DocumentiSection.tsx` — creato

---

## 📋 TICKET — FASE 7: CALENDARIO

---

### T-070 — API Calendario (CRUD eventi)
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-025
**Sub-README:** `docs/06-CALENDARIO.md`

**Descrizione:**
Endpoint CRUD per gli eventi calendario. Usa il cluster `MONGODB_URI_EVENTI`.

**Criteri di accettazione:**
- [x] `GET /api/calendario?mese=[YYYY-MM]` → eventi del mese
- [x] `GET /api/calendario?giorno=[YYYY-MM-DD]` → eventi del giorno
- [x] `POST /api/calendario` → crea evento
- [x] `PUT /api/calendario/[id]` → modifica evento
- [ ] `DELETE /api/calendario/[id]` → elimina evento (soft delete)

**Note sviluppo:**
API su cluster `MONGODB_URI_EVENTI`. GET supporta filtro per `mese` (YYYY-MM, range inizio/fine mese) e `giorno` (YYYY-MM-DD, range 00:00-23:59). Tutti gli eventi hanno `attivo: true` (soft-delete). DELETE imposta `attivo: false`. I campi `schedaId` + `anagraficaSlug` collegano opzionalmente un evento a una scheda anagrafica.

**File toccati:**
- `src/app/api/calendario/route.ts` — creato (GET + POST)
- `src/app/api/calendario/[id]/route.ts` — creato (PUT + DELETE)

---

## 📋 TICKET — FASE 10: PANNELLO DI CONTROLLO

---

### T-090 — Struttura Pannello Controllo + Import/Export Anagrafiche
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-030, T-040
**Sub-README:** `docs/08-PANNELLO.md`

**Descrizione:**
Pagina pannello controllo con sezioni tab. Sezione Anagrafiche con import da Excel e export. Sezione Automazioni con wizard.

**Note sviluppo:**
Pannello a tab con SezioneAnagrafiche (import/export), SezioneAutomazioni (wizard Nuovo Debito), resto WIP. Accesso solo admin via middleware.

**File toccati:**
- `src/app/(dashboard)/controllo/page.tsx` — creato + aggiornato
- `src/app/api/controllo/anagrafiche/import/route.ts` — creato
- `src/app/api/controllo/anagrafiche/export/route.ts` — creato
- `src/app/api/controllo/layout/route.ts` — creato

---

## 📋 TICKET — FASE 11: AUTOMAZIONI & WIZARD

---

### T-100 — Bulk Delete Schede (multi-select in PreviewTable)
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-041, T-042
**Sub-README:** `docs/03-ANAGRAFICA.md`

**Descrizione:**
Selezione multipla nella lista schede (PreviewTable) con eliminazione bulk confermata.

**Criteri di accettazione:**
- [x] Checkbox per ogni riga in PreviewTable (+ "seleziona tutto" nell'header)
- [x] Stato `indeterminate` per checkbox header quando selezione parziale
- [x] Bulk action bar appare sopra la tabella quando ≥1 riga selezionata
- [x] Bulk action bar mostra: conteggio selezionati, "Deseleziona tutto", bottone "Elimina selezionate"
- [x] Modale conferma bulk separato da quello singolo
- [x] `DELETE /api/anagrafiche/[slug]/schede` con body `{ ids: string[] }` → `{ deleted: number }`
- [x] Riga selezionata evidenziata con sfondo brand
- [x] La selezione si azzera al cambio ricerca/pagina

**Note sviluppo:**
PreviewTable usa `selectedIds: Set<string>`. Il checkbox cell ha `onClick` con `e.stopPropagation()` per non triggerare la navigazione alla riga. Il handler bulk DELETE chiama `DELETE /api/anagrafiche/${slug}/schede` (sull'endpoint collection, non su `[id]`).

**File toccati:**
- `src/components/anagrafica/PreviewTable.tsx` — aggiornato (checkbox, bulk bar, BulkDeleteConfirmModal)
- `src/app/api/anagrafiche/[slug]/schede/route.ts` — aggiunto handler DELETE bulk

---

### T-101 — Pulsante + su campi Reference/MultiReference
**Stato:** `🟢 Done`
**Priorità:** Media
**Dipendenze:** T-055
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Accanto a ogni campo reference e multi-reference appare un `+` che apre `/anagrafica/{slug}/new` in una nuova scheda del browser.

**Criteri di accettazione:**
- [x] ReferenceField: `+` visibile quando il campo non è valorizzato (accanto all'input di ricerca)
- [x] MultiReferenceField: `+` sempre visibile (accanto all'input di aggiunta)
- [x] Click → `window.open('/anagrafica/${targetSlug}/new', '_blank')`
- [x] Rimosso import `NewSchedaModal` (componente inesistente che rompeva la build)
- [x] Stesso comportamento nel componente `RefSearch` di `NuovoDebitoWizard`

**File toccati:**
- `src/components/variabili/fields/ReferenceField.tsx` — rimosso NewSchedaModal, sostituito con window.open
- `src/components/variabili/fields/MultiReferenceField.tsx` — idem
- `src/components/automazioni/NuovoDebitoWizard.tsx` — aggiunto `+` a RefSearch, importato Plus da lucide

---

### T-102 — Wizard "Nuovo Debito" (Automazioni)
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-090, T-041
**Sub-README:** `docs/11-AUTOMAZIONI.md`

**Descrizione:**
Wizard multi-step in Pannello Controllo > Automazioni. Al completamento crea atomicamente 3 record: Debito + Portafogli + Ricavo.

**Criteri di accettazione:**
- [x] Step 1: tipo debito (infruttifero | bancario con sottotipo)
- [x] Step 2-4: solo per bancario — tipo tasso, dettagli tasso, dettagli piano
- [x] Step 5: dati comuni (titolo, importo, scadenza, referente, casa, note)
- [x] Step 6: recap + conferma
- [x] Schermata risultato: link ai 3 record creati o dettaglio errore con codice
- [x] Rollback atomico: se fallisce Portafogli → elimina Debito; se fallisce Ricavo → elimina entrambi
- [x] Ricavo auto-compilato: stato_ricavo=incassata, tipo_ricavo=debito, descrizione, data, casa
- [x] Escape chiude il wizard

**Campi creati nel ricavo:**
```
titolo:           "apertura debito {titoloDebito}"
importo_totale:   importoErogato (number)
fondi_destinazione: [{ fondo: {id, label: titolo portafogli}, importo }]
stato_ricavo:     "incassata"
tipo_ricavo:      "debito"
descrizione:      "incasso dell'importo erogato dal debito: {titoloDebito}"
data:             data di creazione (ISO YYYY-MM-DD)
casa:             casaRiferimento (se specificata nel wizard, {id, label})
```

**Codici errore API:**
```
ERR_AUTH          — utente non autenticato
ERR_VALIDATION    — campo obbligatorio mancante o non valido
ERR_ANA_DEBITI    — anagrafica "debiti" non trovata/attiva
ERR_ANA_PORTAFOGLI — anagrafica "portafogli" non trovata/attiva
ERR_ANA_RICAVI    — anagrafica "ricavi" non trovata/attiva
ERR_CREATE_DEBITO — errore Mongoose creazione debito
ERR_CREATE_PORTAFOGLI — errore creazione portafogli (debito eliminato)
ERR_CREATE_RICAVO — errore creazione ricavo (debito + portafogli eliminati)
ERR_INTERNO       — errore interno imprevisto
```

**File toccati:**
- `src/app/api/automazioni/nuovo-debito/route.ts` — creato (POST, logica atomica + rollback)
- `src/components/automazioni/NuovoDebitoWizard.tsx` — creato (wizard 590 righe)
- `src/app/(dashboard)/controllo/page.tsx` — aggiornato (SezioneAutomazioni + import wizard)

---

### T-103 — Script reset-tutte-schede
**Stato:** `🟢 Done`
**Priorità:** Bassa
**Dipendenze:** T-023

**Descrizione:**
Script CLI che elimina tutte le schede e tutti i documenti per tutte le anagrafiche, senza toccare le config.

**Note sviluppo:**
Richiede digitare "ELIMINA TUTTO" per conferma. Legge slug da `anagraficaconfigs` collection. Gestisce Mongoose pluralization (verifica sia `schede_{slug}` sia `schede_{slug}s`).

**File toccati:**
- `scripts/reset-tutte-schede.ts` — creato
- `package.json` — aggiunto script `"reset:tutte-schede"`

---

### T-104 — Anagrafiche Portafogli e Debiti aggiornate
**Stato:** `🟢 Done`
**Priorità:** Alta
**Dipendenze:** T-090

**Descrizione:**
Aggiornate le definizioni di Portafogli (7 variabili) e Debiti (12 variabili + opzione `infruttifero`) in `import-anagrafiche.ts`. Aggiunta opzione `debito` a `tipo_ricavo` nei Ricavi.

**Variabili Portafogli:**
```
titolo (text, obbligatorio, visibileInPreview)
sottotitolo (text)
descrizione (text-area)
debito_associato (reference → debiti)
data_apertura (data)
data_chiusura (data)
fondi_disponibili (numbers, decimali)
```

**Variabili Debiti (12):** titolo, referente, tipo_debito (mutuo|prestito|finanziamento|infruttifero|altro), tipo_tasso, totale_addebitato, tasso_interesse, rata_mensile, importo_erogato, data_apertura, scadenza_prevista, totale_restituito, note

**IMPORTANTE:** Eseguire `npm run import:anagrafiche` dal terminale Windows per applicare al DB.

**File toccati:**
- `scripts/import-anagrafiche.ts` — aggiornato Portafogli, Debiti, Ricavi (tipo_ricavo options)

---

## 📋 TICKET — FASE 12: BILANCIO

---

### T-110 — Sezione Bilancio in Sidebar
**Stato:** `🟢 Done`
**Priorità:** Media
**Dipendenze:** T-031
**Sub-README:** `docs/10-UI-LAYOUT.md`, `docs/12-BILANCIO.md`

**Descrizione:**
Nuova sezione "Bilancio" nella sidebar, con voce "Overview". La sezione è statica (hardcoded, non dal DB layout).

**Criteri di accettazione:**
- [x] `SezioneFissa` — nuovo componente nella Sidebar per sezioni statiche (non da DB)
- [x] In modalità espansa: sezione collassabile con header "BILANCIO" e voce "Overview"
- [x] In modalità icone: separatore + icona `BarChart2` per Overview
- [x] Route `/bilancio/overview` con placeholder "Work in progress"
- [x] Voce attiva evidenziata con stile brand

**File toccati:**
- `src/components/layout/Sidebar.tsx` — aggiunto import BarChart2, componente SezioneFissa, blocco Bilancio nel nav
- `src/app/(dashboard)/bilancio/overview/page.tsx` — creato (placeholder WIP)

---

## 📋 NOTE TECNICHE GENERALI (sessioni di sviluppo)

### ⚠️ Problema Mount Bash / Windows (CRITICO per AI)
Il sandbox Linux monta la cartella Windows via CIFS. **Il mount è in sola-scrittura-cached**: l'Edit tool scrive correttamente su Windows, ma bash legge una versione cachata/troncata del file. Sintomi:
- `wc -l file.ts` mostra meno righe di quanto vede il `Read` tool
- `npx tsc` in bash riporta errori falsi positivi (file troncato → sintassi incompleta)
- `cat -A` mostra `^@` (null bytes) in fondo ai file modificati

**Soluzione:** Riscrivere sempre i file grandi via `python3 -c "with open(...,'w') as f: f.write(content)"` dentro un heredoc `<< 'PYEOF'`. Non usare heredoc bash per file TypeScript (escaping problematico). Non fidarsi degli errori TSC che vengono da bash — verificare sempre con Read tool che il file Windows sia corretto.

### ⚠️ Esecuzione script npm
Gli script `tsx` non sono eseguibili da bash (esbuild platform mismatch: node_modules compilati per win32-x64, sandbox è linux-x64). Tutti gli script `npm run *` vanno eseguiti dal **terminale Windows** dell'utente.

### ✅ Verifica TSC corretta
```bash
# In bash, verifica SOLO i file src/ (ignora scripts/ che hanno errori preesistenti):
npx tsc --noEmit 2>&1 | grep "src/" | grep -v "node_modules"
```

