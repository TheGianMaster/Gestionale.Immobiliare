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
| `docs/08-PANNELLO.md` | Pannello controllo, sezioni WIP | Fase 10 |
| `docs/09-PALETTE.md` | Palette colori, design tokens, CSS vars | Fase 12 |
| `docs/10-UI-LAYOUT.md` | Layout, sidebar, header, responsive | Fase 3 |
| `skills/README-SKILLS.md` | Sistema skills agente, ottimizzazione token | Sempre |

---

## 🏗️ STACK TECNOLOGICO

```
Framework:     Next.js 14+ (App Router)
Linguaggio:    TypeScript
UI:            React + TailwindCSS
Database:      MongoDB (multi-cluster)
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
**Stato:** `🟡 Da convalidare`
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
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-001
**Sub-README:** `docs/00-SETUP.md`

**Descrizione:**
Crea `.env.example` basato sul template fornito. Installa tutte le dipendenze NPM necessarie al progetto.

**Criteri di accettazione:**
- [ ] `.env.example` creato con tutte le variabili commentate
- [ ] Dipendenze installate: `mongoose`, `next-auth`, `bcryptjs`, `@aws-sdk/client-s3`, `resend`, `zod`, `date-fns`, `lucide-react`, `@radix-ui/react-*` (select, dialog, popover)
- [ ] DevDependencies: `@types/bcryptjs`, `@types/node`
- [ ] `package.json` con script `dev`, `build`, `start`, `lint`

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-003 — Palette colori e design tokens
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-001
**Sub-README:** `docs/09-PALETTE.md`

**Descrizione:**
Crea il sistema di design tokens. File `palette.ts` come FONTE DI VERITÀ per tutti i colori. CSS variables in `globals.css`. TailwindCSS configurato per usare le variabili.

**Criteri di accettazione:**
- [ ] `src/styles/palette.ts` con tutti i colori nominati
- [ ] `src/styles/tokens.ts` con spacing, radius, shadows, typography
- [ ] `src/styles/globals.css` con CSS variables generate dalla palette
- [ ] `tailwind.config.ts` aggiornato per usare CSS variables
- [ ] Supporto tema chiaro/scuro (CSS variables dual-theme)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-004 — Setup connessioni MongoDB multi-cluster
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-002
**Sub-README:** `docs/02-DATABASE.md`

**Descrizione:**
Configura le connessioni MongoDB. Il progetto usa cluster separati per anagrafiche, eventi e la connessione principale. Implementa il pattern singleton per le connessioni (evita reconnect su ogni API call in dev).

**Criteri di accettazione:**
- [ ] `src/lib/mongodb.ts` — connessione principale (utenti, notifiche, config)
- [ ] `src/lib/mongodb-anagrafiche.ts` — cluster `MONGODB_URI_ANAGRAFICHE`
- [ ] `src/lib/mongodb-eventi.ts` — cluster `MONGODB_URI_EVENTI`
- [ ] Ogni connessione usa pattern singleton con cache globale (Next.js hot reload safe)
- [ ] Gestione errori connessione con log chiari
- [ ] Timeout configurabile via env

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 1: AUTENTICAZIONE & UTENTI

---

### T-010 — Modello User MongoDB
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-004
**Sub-README:** `docs/01-AUTH.md`

**Descrizione:**
Crea il modello Mongoose per gli utenti. La password deve essere hashata con bcrypt + pepper prima del salvataggio. Include hook pre-save per la crittografia automatica.

**Criteri di accettazione:**
- [ ] `src/models/User.ts` con schema completo
- [ ] Campi: `_id`, `email`, `passwordHash`, `nome`, `cognome`, `ruolo` (admin|operatore), `attivo` (boolean), `createdAt`, `updatedAt`, `lastLogin`, `sessionDuration` (default 72h, override futuro da pannello)
- [ ] Hook `pre('save')` che cripta la password con `bcrypt.hash(password + INVITE_TOKEN_PEPPER, 12)`
- [ ] Metodo `comparePassword(candidate: string): Promise<boolean>`
- [ ] Index su `email` (unique)
- [ ] TypeScript types esportati

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-011 — NextAuth configuration (Credentials Provider)
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-010
**Sub-README:** `docs/01-AUTH.md`

**Descrizione:**
Configura NextAuth con Credentials Provider. La sessione dura 72 ore (JWT). Aggiorna `lastLogin` ad ogni accesso. Gestione errori login con messaggi chiari.

**Criteri di accettazione:**
- [ ] `src/lib/auth.ts` con config NextAuth
- [ ] `src/app/api/auth/[...nextauth]/route.ts`
- [ ] JWT maxAge = 72 * 60 * 60 (72 ore)
- [ ] Il JWT include: `userId`, `email`, `ruolo`, `nome`, `expiresAt`
- [ ] Al login: verifica email, verifica password (bcrypt + pepper), aggiorna `lastLogin`
- [ ] Middleware `src/middleware.ts` che protegge tutte le route `(dashboard)/*`
- [ ] Redirect a `/login` se sessione assente o scaduta

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-012 — Pagina Login UI
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-011, T-003
**Sub-README:** `docs/01-AUTH.md`, `docs/10-UI-LAYOUT.md`

**Descrizione:**
Pagina di login responsive, pulita, con branding. Include nota visibile all'utente che la sessione dura 72 ore e che il tempo di logout automatico sarà configurabile dal pannello utenze.

**Criteri di accettazione:**
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] Campi: email, password (con toggle show/hide)
- [ ] Stato loading durante submit
- [ ] Messaggi errore inline (credenziali errate, account disattivo)
- [ ] Nota UI: *"La sessione rimane attiva per 72 ore. Il tempo di logout automatico sarà configurabile dal Pannello Controllo > Utenze."*
- [ ] Responsive mobile-first
- [ ] Redirect a `/` (dashboard) se già autenticato
- [ ] Usa palette colori definita in T-003

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-013 — Seeding admin iniziale
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 2: SCHEMA DATABASE & MODELLI

---

### T-020 — Schema AnagraficaConfig
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-004
**Sub-README:** `docs/02-DATABASE.md`, `docs/03-ANAGRAFICA.md`

**Descrizione:**
Modello che definisce una "tipologia" di anagrafica (es: Clienti, Fornitori, Prodotti). Contiene la configurazione dei campi visibili nella preview e il riferimento alle variabili associate.

**Criteri di accettazione:**
- [ ] `src/models/AnagraficaConfig.ts`
- [ ] Campi: `slug` (unique, URL-safe), `nome`, `descrizione`, `icona`, `colore`, `variabili` (array di ref → Variabile), `previewColumns` (array di slug variabile da mostrare in lista), `tipiDocumento` (array stringhe — gestito da admin, commentato come WIP), `attiva` (boolean), `ordine` (numero per sidebar), `createdAt`, `updatedAt`
- [ ] Index su `slug` (unique)
- [ ] Index su `attiva`

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-021 — Schema Variabile (field type system)
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-020
**Sub-README:** `docs/02-DATABASE.md`, `docs/04-VARIABILI.md`

**Descrizione:**
Modello che descrive un singolo campo/variabile. Contiene il tipo e le configurazioni specifiche per tipo. È il cuore del sistema anagrafico.

**Criteri di accettazione:**
- [ ] `src/models/Variabile.ts`
- [ ] Campi base: `slug`, `label`, `tipo` (enum: text|text-area|numbers|mail|phone|data|select|reference|multi-reference|variantID), `obbligatorio` (boolean), `descrizione`, `placeholder`, `anagraficaRef` (slug anagrafica di appartenenza)
- [ ] Campi per tipo `select`: `opzioniRef` → ref a SelectOption collection
- [ ] Campi per tipo `reference`/`multi-reference`: `targetAnagrafica` (slug), `displayField` (campo da mostrare nella lookup)
- [ ] Campi per tipo `variantID`: nessuno extra (gestito da Variante)
- [ ] Campi per tipo `numbers`: `min`, `max`, `decimali` (boolean)
- [ ] Campi per tipo `text`: `maxLength` (default 255)
- [ ] `visibileInPreview` (boolean), `ordine` (numero)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-022 — Schema Variante
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-021
**Sub-README:** `docs/02-DATABASE.md`

**Descrizione:**
Una variante definisce una "versione" di un'anagrafica con visibilità personalizzata dei campi. Esempio: anagrafica "Cliente" con variante "Privato" che nasconde il campo "P.IVA".

**Criteri di accettazione:**
- [ ] `src/models/Variante.ts`
- [ ] Campi: `nome`, `slug`, `anagraficaRef` (slug), `variabiliOsculte` (array di slug variabile), `variabiliObbligatorie` (override obbligatorietà), `descrizione`, `colore`, `icona`
- [ ] La scheda con un variantID specifico usa questa configurazione per mostrare/nascondere campi
- [ ] Index su `[anagraficaRef, slug]` (unique per anagrafica)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-023 — Schema Scheda (record anagrafico)
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-021, T-022
**Sub-README:** `docs/02-DATABASE.md`

**Descrizione:**
Rappresenta un singolo record all'interno di un'anagrafica. I dati sono flessibili (schema-less per i valori) ma typizzati tramite le Variabili associate.

**Criteri di accettazione:**
- [ ] `src/models/Scheda.ts`
- [ ] Campi: `_id`, `anagraficaSlug`, `variantID` (slug variante, opzionale), `dati` (Record<string, any> — chiave = slug variabile, valore = dato), `createdAt`, `updatedAt`, `createdBy` (ref User), `updatedBy` (ref User), `attiva` (boolean, default true)
- [ ] Index su `anagraficaSlug`
- [ ] Index su `[anagraficaSlug, variantID]`
- [ ] Index su `createdAt`
- [ ] NOTA: i reference sono salvati come ObjectId stringificato + label display (per evitare lookup ogni volta)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-024 — Schema Documento
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-023
**Sub-README:** `docs/02-DATABASE.md`, `docs/05-DOCUMENTI.md`

**Descrizione:**
Metadati dei documenti caricati. Il file fisico è su Cloudflare R2; qui si salvano solo i metadati.

**Criteri di accettazione:**
- [ ] `src/models/Documento.ts`
- [ ] Campi: `_id`, `schedaId`, `anagraficaSlug`, `nomeFile`, `tipoDocumento` (stringa, da lista gestita in admin — WIP), `mimeType` (jpeg|pdf|html), `dimensione` (bytes), `r2Key` (percorso su R2), `r2Url` (URL pubblico o presigned), `caricatoDa` (ref User), `caricatoAt`, `note`
- [ ] Index su `schedaId`
- [ ] MIME type accettati: `image/jpeg`, `application/pdf`, `text/html`

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-025 — Schema Evento (calendario)
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-004
**Sub-README:** `docs/02-DATABASE.md`, `docs/06-CALENDARIO.md`

**Descrizione:**
Modello per gli eventi del calendario. Connesso al cluster `MONGODB_URI_EVENTI`.

**Criteri di accettazione:**
- [ ] `src/models/Evento.ts`
- [ ] Campi: `_id`, `titolo`, `descrizione`, `inizio` (Date), `fine` (Date), `tuttoIlGiorno` (boolean), `colore`, `etichette` (array stringhe), `collegamentoScheda` (schedaId opzionale), `collegamentoAnagrafica` (slug opzionale), `createdBy`, `partecipanti` (array userId), `createdAt`, `updatedAt`
- [ ] Index su `inizio`, `fine`
- [ ] NOTA: il cluster di destinazione è `MONGODB_URI_EVENTI`

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-026 — Schema Notifica
**Stato:** `🔴 Da sviluppare`
**Priorità:** Media
**Dipendenze:** T-004
**Sub-README:** `docs/02-DATABASE.md`, `docs/07-NOTIFICHE.md`

**Descrizione:**
Modello per le notifiche in-app. Ogni notifica è associata ad un utente e può avere un link di riferimento.

**Criteri di accettazione:**
- [ ] `src/models/Notifica.ts`
- [ ] Campi: `_id`, `userId` (destinatario), `titolo`, `messaggio`, `tipo` (info|success|warning|error), `letta` (boolean, default false), `link` (URL opzionale per navigare al contesto), `createdAt`, `expires` (TTL index 30 giorni)
- [ ] Index su `[userId, letta]`
- [ ] TTL index su `createdAt` (expire dopo 30 giorni)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-027 — Schema SelectOption
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-021
**Sub-README:** `docs/02-DATABASE.md`, `docs/04-VARIABILI.md`

**Descrizione:**
Opzioni per i campi di tipo `select`. Gestibili dal pannello admin (WIP). Raggruppate per variabile.

**Criteri di accettazione:**
- [ ] `src/models/SelectOption.ts`
- [ ] Campi: `_id`, `variabileSlug`, `anagraficaSlug`, `label`, `valore`, `colore` (opzionale, per badge colorati), `ordine`, `attiva` (boolean)
- [ ] Index su `[variabileSlug, anagraficaSlug]`
- [ ] Index su `ordine`

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 3: LAYOUT & NAVIGAZIONE

---

### T-030 — Layout dashboard principale
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-012, T-003
**Sub-README:** `docs/10-UI-LAYOUT.md`

**Descrizione:**
Layout generale della dashboard. Sidebar sinistra + header fisso in alto + area contenuto principale. Fully responsive: sidebar collassabile su mobile (hamburger), full-width su desktop.

**Criteri di accettazione:**
- [ ] `src/app/(dashboard)/layout.tsx`
- [ ] Sidebar sinistra fissa (desktop), drawer su mobile
- [ ] Header fisso in alto con: logo/nome app, breadcrumb, campanellina notifiche, nome utente + menu
- [ ] Area contenuto scrollabile
- [ ] Sidebar voci: Dashboard, [anagrafiche dinamiche da db], Calendario, Pannello Controllo
- [ ] Animazione apertura/chiusura sidebar mobile (Framer Motion o CSS transition)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-031 — Componente Sidebar
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-030
**Sub-README:** `docs/10-UI-LAYOUT.md`

**Descrizione:**
Sidebar di navigazione. Le voci delle anagrafiche sono caricate dinamicamente da db. Ogni voce anagrafica ha l'icona e il colore configurati nell'AnagraficaConfig.

**Criteri di accettazione:**
- [ ] `src/components/layout/Sidebar.tsx`
- [ ] Carica `AnagraficaConfig` via API per costruire le voci dinamicamente
- [ ] Voce attiva evidenziata con colore palette
- [ ] Ogni voce anagrafica mostra: icona + nome
- [ ] Sezioni fisse: Dashboard (home), Calendario, Pannello Controllo
- [ ] Footer sidebar: versione app + link docs

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-032 — Componente Header + NotificationBell
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-030, T-026
**Sub-README:** `docs/10-UI-LAYOUT.md`, `docs/07-NOTIFICHE.md`

**Descrizione:**
Header principale con campanellina notifiche (con badge numero notifiche non lette) e menu utente.

**Criteri di accettazione:**
- [ ] `src/components/layout/Header.tsx`
- [ ] `src/components/layout/NotificationBell.tsx` — campanellina con badge numerico
- [ ] `src/components/layout/UserMenu.tsx` — dropdown nome utente con: profilo, logout
- [ ] La campanellina fa polling ogni 60 secondi per aggiornare il counter
- [ ] Click sulla campanellina apre dropdown con ultime 5 notifiche non lette + link "Vedi tutte"
- [ ] Badge campanellina: nascosto se 0 notifiche, visibile se ≥1

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 4: MOTORE ANAGRAFICA

---

### T-040 — API CRUD Anagrafiche Config
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-041 — API CRUD Schede
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-042 — Pagina Preview Anagrafica (lista schede)
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-043 — Pagina View Scheda
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-044 — Pagina Edit Scheda (Form)
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 5: TIPI DI VARIABILI (FIELD TYPES)

---

### T-050 — FieldRenderer (dispatcher centrale)
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-051 — Campo TEXT e TEXT-AREA
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-052 — Campo NUMBERS, MAIL, PHONE
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-053 — Campo DATA (con calendar picker)
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-054 — Campo SELECT (dropdown)
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-055 — Campo REFERENCE e MULTI-REFERENCE
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-056 — Campo VARIANTID
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 6: SEZIONE DOCUMENTI SCHEDA

---

### T-060 — API Upload e Gestione Documenti (R2)
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-024, T-002
**Sub-README:** `docs/05-DOCUMENTI.md`

**Descrizione:**
API per upload file su Cloudflare R2 e gestione metadati in MongoDB. Accetta JPEG, PDF, HTML.

**Criteri di accettazione:**
- [ ] `src/lib/r2.ts` — client S3-compatible per R2 (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`)
- [ ] `POST /api/documenti/upload` — riceve file multipart, carica su R2, salva metadati
- [ ] `GET /api/documenti?schedaId=[id]` — lista documenti di una scheda
- [ ] `DELETE /api/documenti/[id]` — elimina da R2 + db
- [ ] `GET /api/documenti/[id]/url` — genera URL presigned per download (expire 1h)
- [ ] Percorso R2: `{anagraficaSlug}/{schedaId}/{timestamp}-{nomeFile}`
- [ ] Validazione MIME type: solo `image/jpeg`, `application/pdf`, `text/html`
- [ ] Limite dimensione: 10MB per file

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-061 — UI Sezione Documenti Scheda
**Stato:** `🔴 Da sviluppare`
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

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 7: CALENDARIO

---

### T-070 — API Calendario (CRUD eventi)
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-025
**Sub-README:** `docs/06-CALENDARIO.md`

**Descrizione:**
Endpoint CRUD per gli eventi calendario. Usa il cluster `MONGODB_URI_EVENTI`.

**Criteri di accettazione:**
- [ ] `GET /api/calendario?mese=[YYYY-MM]` → eventi del mese
- [ ] `GET /api/calendario?giorno=[YYYY-MM-DD]` → eventi del giorno
- [ ] `POST /api/calendario` → crea evento
- [ ] `PUT /api/calendario/[id]` → modifica evento
- [ ] `DELETE /api/calendario/[id]` → elimina evento
- [ ] Filtra per `partecipanti` (utente corrente) o `createdBy`
- [ ] Risposta include info scheda collegata se presente

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-071 — UI Calendario — Vista Mese
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-070
**Sub-README:** `docs/06-CALENDARIO.md`

**Descrizione:**
Vista mensile del calendario stile Google Calendar. Griglia 7 colonne, eventi visualizzati nelle celle giorno.

**Criteri di accettazione:**
- [ ] `src/components/calendario/CalendarMonth.tsx`
- [ ] Navigazione prev/next mese con frecce, click su "Oggi"
- [ ] Celle giorno: cliccabili per andare alla vista giorno
- [ ] Eventi nella cella: pill colorato con titolo troncato, max 3 visibili + "altri N"
- [ ] Click evento → apre `EventModal` in modalità view
- [ ] Pulsante "+" su ogni cella → apre `EventModal` in modalità crea con data preimpostata
- [ ] Etichette/flag eventi: colore del pill basato su `colore` evento o prima etichetta

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-072 — UI Calendario — Vista Giorno + EventModal
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-071
**Sub-README:** `docs/06-CALENDARIO.md`

**Descrizione:**
Vista giornaliera con timeline oraria. Modale per creazione/modifica eventi con gestione etichette.

**Criteri di accettazione:**
- [ ] `src/components/calendario/CalendarDay.tsx` — timeline 00:00-23:30, eventi posizionati per ora
- [ ] Switch vista: bottoni Mese | Giorno nella pagina calendario
- [ ] `src/components/calendario/EventModal.tsx` — modale creazione/modifica:
  - Titolo, descrizione, data inizio, ora inizio, data fine, ora fine
  - Toggle "Tutto il giorno"
  - Selezione colore evento (palette predefinita 8 colori)
  - Campo etichette (tag liberi, digitabili, multipli)
  - Link scheda anagrafica (campo reference opzionale)
  - Partecipanti (utenti del sistema)
- [ ] Pulsante delete nell'EventModal se modalità edit (con conferma)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 8: NOTIFICHE

---

### T-080 — API Notifiche + Sistema
**Stato:** `🔴 Da sviluppare`
**Priorità:** Media
**Dipendenze:** T-026
**Sub-README:** `docs/07-NOTIFICHE.md`

**Descrizione:**
API per gestione notifiche in-app. Include funzione utility per creare notifiche da qualsiasi parte del sistema.

**Criteri di accettazione:**
- [ ] `GET /api/notifiche?letta=false` → notifiche non lette utente corrente
- [ ] `GET /api/notifiche?limit=5` → ultime N notifiche
- [ ] `PATCH /api/notifiche/[id]/leggi` → segna come letta
- [ ] `PATCH /api/notifiche/leggi-tutte` → segna tutte come lette
- [ ] `src/lib/notifiche.ts` → funzione `creaNotifica(userId, data)` riutilizzabile
- [ ] Counter non lette: `GET /api/notifiche/count`

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-081 — UI NotificationBell e Lista
**Stato:** `🔴 Da sviluppare`
**Priorità:** Media
**Dipendenze:** T-080, T-032
**Sub-README:** `docs/07-NOTIFICHE.md`

**Descrizione:**
Componente campanellina nell'header con dropdown lista notifiche.

**Criteri di accettazione:**
- [ ] `src/components/notifiche/NotificationBell.tsx` — icona campanellina + badge numero
- [ ] Badge: rosso, numero non lette (nascosto se 0)
- [ ] Click → apre `NotificationList` come dropdown
- [ ] `src/components/notifiche/NotificationList.tsx`:
  - Lista ultime 5 notifiche con: icona tipo, titolo, messaggio troncato, data relativa
  - Notifiche non lette: sfondo leggermente evidenziato
  - Pulsante "Segna tutte come lette"
  - Link "Vedi tutte le notifiche" → pagina `/notifiche`
- [ ] Click su notifica → segna come letta + naviga al link se presente
- [ ] Polling ogni 60 secondi per aggiornare counter

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 9: PANNELLO CONTROLLO

---

### T-090 — Pannello Controllo (WIP Shell)
**Stato:** `🔴 Da sviluppare`
**Priorità:** Media
**Dipendenze:** T-030
**Sub-README:** `docs/08-PANNELLO.md`

**Descrizione:**
Struttura del pannello di controllo con navigazione interna alle sezioni. Ogni sezione mostra "Work in Progress" con styling professionale. Solo admin può accedere.

**Criteri di accettazione:**
- [ ] `src/app/(dashboard)/controllo/page.tsx`
- [ ] Solo utenti con `ruolo === 'admin'` possono accedere (redirect 403 altrimenti)
- [ ] Layout con sidebar secondaria (o tab) per le sezioni:
  - Anagrafiche
  - Varianti
  - Variabili
  - Utenze *(nota: qui sarà gestito il timeout sessione — aggiungi nota UI)*
  - Documenti *(nota: qui saranno gestiti i tipi documento per anagrafica)*
  - Automazioni
- [ ] Ogni sezione mostra: titolo + descrizione + badge "🚧 Work in Progress"
- [ ] Stile professionale — non un placeholder grezzo

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 10: SISTEMA SKILLS AGENTE

---

### T-100 — Struttura cartella Skills
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** nessuna
**Sub-README:** `skills/README-SKILLS.md`

**Descrizione:**
Crea la struttura delle skill per ottimizzare i token quando l'agente opera sul sistema. Ogni skill è un documento conciso che descrive come operare su una specifica area del sistema.

**Criteri di accettazione:**
- [ ] `skills/README-SKILLS.md` — indice master delle skill
- [ ] `skills/skill-anagrafica.md` — come creare/modificare config anagrafiche
- [ ] `skills/skill-variabili.md` — come aggiungere tipi di campo, configurare validazioni
- [ ] `skills/skill-documenti.md` — come gestire upload, tipi documento
- [ ] `skills/skill-calendario.md` — come creare/modificare eventi
- [ ] Ogni skill: max 200 righe, solo ciò che serve per eseguire il task, link precisi ai file

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 11: PALETTE & DESIGN SYSTEM

---

### T-110 — File Palette e Design Tokens
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-001
**Sub-README:** `docs/09-PALETTE.md`

**Descrizione:**
Implementazione completa del sistema di design tokens. Fonte di verità centralizzata per tutti i colori e valori di design.

**Criteri di accettazione:**
- [ ] `src/styles/palette.ts` — tutti i colori come costanti TypeScript
- [ ] `src/styles/tokens.ts` — spacing, border-radius, shadows, z-index, breakpoints, typography scale
- [ ] `src/styles/globals.css` — CSS custom properties generate da palette + reset base
- [ ] `tailwind.config.ts` — extend con CSS variables per colori + font
- [ ] Tema chiaro e scuro: due set di CSS variables (`[data-theme="light"]`, `[data-theme="dark"]`)
- [ ] Componente `ThemeToggle` per switch manuale (salvato in localStorage)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-111 — Componenti UI Base
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-110
**Sub-README:** `docs/09-PALETTE.md`

**Descrizione:**
Libreria di componenti UI base utilizzati ovunque nel progetto. Tutti devono usare i CSS tokens.

**Criteri di accettazione:**
- [ ] `src/components/ui/Button.tsx` — varianti: primary, secondary, ghost, danger; dimensioni: sm, md, lg; stati: loading, disabled
- [ ] `src/components/ui/Input.tsx` — con label, error, helper text, icona prefisso/suffisso
- [ ] `src/components/ui/Modal.tsx` — dialog accessibile con overlay, close button, animazione
- [ ] `src/components/ui/Badge.tsx` — varianti colore, con punto colorato opzionale
- [ ] `src/components/ui/Skeleton.tsx` — placeholder loading animato
- [ ] `src/components/ui/Toast.tsx` — notifiche temporanee (success, error, info, warning)
- [ ] `src/components/ui/Card.tsx` — contenitore con border, shadow, padding
- [ ] `src/components/ui/Spinner.tsx` — loading spinner

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 12: SEED DATI & CONFIGURAZIONE INIZIALE

---

### T-120 — Seed dati iniziali sistema
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-020, T-021, T-022, T-013
**Sub-README:** `docs/00-SETUP.md`

**Descrizione:**
Script per popolare il db con la configurazione base del sistema. Crea un'anagrafica "Clienti" di esempio con variabili e varianti di esempio.

**Criteri di accettazione:**
- [ ] `scripts/seed-data.ts`
- [ ] Crea anagrafica "Clienti" con slug `clienti`
- [ ] Variabili: nome (text), cognome (text), email (mail), telefono (phone), piva (text), note (text-area), tipo_cliente (select con opzioni: Azienda, Privato, Professionista), variantID
- [ ] Variante "Azienda": visibile tutto, P.IVA obbligatoria
- [ ] Variante "Privato": P.IVA oscurata
- [ ] SelectOptions per tipo_cliente
- [ ] 3 schede di esempio
- [ ] Script idempotente (non ricrea se già esiste)

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 13: QUALITÀ & SICUREZZA

---

### T-130 — Middleware sicurezza e protezione route
**Stato:** `🔴 Da sviluppare`
**Priorità:** 🔴 Critica
**Dipendenze:** T-011
**Sub-README:** `docs/01-AUTH.md`

**Descrizione:**
Middleware Next.js per protezione route, rate limiting, CSRF protection.

**Criteri di accettazione:**
- [ ] `src/middleware.ts` — controlla sessione NextAuth su tutte le route `(dashboard)`
- [ ] API routes: verifica sessione con `getServerSession`
- [ ] Rate limiting semplice su `/api/auth` (max 10 tentativi/minuto per IP)
- [ ] Headers sicurezza: CSP, X-Frame-Options, X-Content-Type-Options
- [ ] Sanitizzazione input su tutte le API (Zod strip unknown keys)
- [ ] Admin-only routes: `/controllo/*` accessibile solo da ruolo admin

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

### T-131 — Validatori Zod centralizzati
**Stato:** `🔴 Da sviluppare`
**Priorità:** Alta
**Dipendenze:** T-021
**Sub-README:** `docs/04-VARIABILI.md`

**Descrizione:**
Funzione che genera dinamicamente uno schema Zod per validare i dati di una scheda in base alle Variabili configurate.

**Criteri di accettazione:**
- [ ] `src/lib/validators.ts`
- [ ] Funzione `buildSchedaSchema(variabili: Variabile[], variantID?: string): z.ZodSchema`
- [ ] Per ogni tipo Variabile genera il validator Zod corretto:
  - text → `z.string().max(maxLength)`
  - mail → `z.string().email()`
  - phone → `z.string().regex(/^[0-9+\s\-()]+$/)`
  - numbers → `z.number().min(min).max(max)`
  - data → `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`
  - select → `z.string()` (o z.enum con opzioni)
  - reference → `z.object({id: z.string(), label: z.string()})`
  - multi-reference → `z.array(z.object({id: z.string(), label: z.string()}))`
- [ ] Variabili oscurate dalla variante → campo opzionale nello schema
- [ ] Esportato e usato sia lato client che server

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📋 TICKET — FASE 14: DEPLOY & DOCUMENTAZIONE

---

### T-140 — CHANGELOG e documentazione deploy
**Stato:** `🔴 Da sviluppare`
**Priorità:** Bassa
**Dipendenze:** tutti i ticket precedenti
**Sub-README:** nessuno

**Descrizione:**
Documentazione di deploy e changelog iniziale.

**Criteri di accettazione:**
- [ ] `CHANGELOG.md` con versione 0.1.0 e lista feature implementate
- [ ] Sezione in `docs/00-SETUP.md` su come deployare su Vercel
- [ ] Checklist variabili d'ambiente per produzione
- [ ] Note su MongoDB Atlas indexes da creare manualmente
- [ ] Guida backup R2

**Note sviluppo:** *(compilare quando Done)*

**File toccati:** *(compilare quando Done)*

---

## 📊 RIEPILOGO TICKET

| Fase | Ticket | Stato |
|------|--------|-------|
| Fase 0 - Setup | T-001 🟡, T-002, T-003, T-004 | 🟡/🔴 |
| Fase 1 - Auth | T-010, T-011, T-012, T-013 | 🔴 Da sviluppare |
| Fase 2 - Database | T-020..T-027 | 🔴 Da sviluppare |
| Fase 3 - Layout | T-030, T-031, T-032 | 🔴 Da sviluppare |
| Fase 4 - Anagrafica | T-040..T-044 | 🔴 Da sviluppare |
| Fase 5 - Field Types | T-050..T-056 | 🔴 Da sviluppare |
| Fase 6 - Documenti | T-060, T-061 | 🔴 Da sviluppare |
| Fase 7 - Calendario | T-070, T-071, T-072 | 🔴 Da sviluppare |
| Fase 8 - Notifiche | T-080, T-081 | 🔴 Da sviluppare |
| Fase 9 - Pannello | T-090 | 🔴 Da sviluppare |
| Fase 10 - Skills | T-100 | 🔴 Da sviluppare |
| Fase 11 - UI System | T-110, T-111 | 🔴 Da sviluppare |
| Fase 12 - Seed | T-120 | 🔴 Da sviluppare |
| Fase 13 - Qualità | T-130, T-131 | 🔴 Da sviluppare |
| Fase 14 - Deploy | T-140 | 🔴 Da sviluppare |

**Totale ticket: 37**

---

## ⚠️ REGOLE OPERATIVE PER CLAUDE CODE

1. **Leggi sempre il README prima di iniziare.** Non saltare passi.
2. **Un ticket alla volta.** Non passare al successivo senza convalida utente.
3. **Aggiorna lo stato del ticket** non appena inizi, quando finisci, e dopo la convalida.
4. **Consulta il sub-README** relativo al ticket corrente per dettagli tecnici.
5. **Consulta le skills** in `skills/` per ottimizzare le operazioni ripetitive.
6. **Mai toccare** file al di fuori dello scope del ticket corrente.
7. **Commenta il codice** in italiano dove ha senso operativamente, in inglese per costrutti tecnici standard.
8. **Aggiorna `File toccati`** con percorsi precisi al completamento di ogni ticket.
