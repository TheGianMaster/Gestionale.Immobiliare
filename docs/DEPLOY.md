# DEPLOY — Gestionale Immobiliare
> Guida step-by-step per mettere in produzione l'app su Vercel + MongoDB Atlas.

---

## 1. PREREQUISITI

- Account [Vercel](https://vercel.com) (free tier sufficiente per sviluppo)
- Account [MongoDB Atlas](https://cloud.mongodb.com) con cluster M0 gratuito
- Account [Cloudflare](https://cloudflare.com) con R2 abilitato (per documenti)
- Repository Git (GitHub/GitLab/Bitbucket)

---

## 2. MONGODB ATLAS

### 2.1 Crea cluster
1. MongoDB Atlas > **Build a Database** > **M0 Free**
2. Provider: AWS, Region: EU (Frankfurt o Ireland)
3. Cluster name: `gestionale-prod`

### 2.2 Crea utente DB
1. **Database Access** > Add New Database User
2. Username: `gestionale-user`
3. Password: genera password sicura (salva in un posto sicuro)
4. Role: **Atlas Admin** (o Database Admin sul cluster)

### 2.3 Whitelist IP
1. **Network Access** > Add IP Address
2. Aggiungi `0.0.0.0/0` (Vercel usa IP dinamici)
   - Alternativa piu sicura: aggiungere i Vercel Edge IPs specifici

### 2.4 Ottieni Connection String
1. **Clusters** > **Connect** > **Connect your application**
2. Driver: Node.js, Version: 6.x+
3. Copia la stringa: `mongodb+srv://gestionale-user:<password>@gestionale-prod.xxxxx.mongodb.net/`
4. Sostituisci `<password>` con la password creata

---

## 3. CLOUDFLARE R2 (documenti)

### 3.1 Crea bucket
1. Cloudflare Dashboard > **R2** > **Create bucket**
2. Nome: `gestionale-docs`
3. Location: EU (Inferred o Hindered)

### 3.2 API Token
1. **R2** > **Manage R2 API Tokens** > **Create API token**
2. Permissions: **Object Read & Write**
3. Bucket: `gestionale-docs`
4. Salva:
   - `Access Key ID`
   - `Secret Access Key`
   - Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

### 3.3 CORS policy
Nel bucket R2, tab **Settings** > **CORS**:
```json
[
  {
    "AllowedOrigins": ["https://tuo-dominio.vercel.app"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "MaxAgeSeconds": 86400
  }
]
```

---

## 4. VERCEL DEPLOY

### 4.1 Importa progetto
1. [vercel.com/new](https://vercel.com/new)
2. Import dal repository Git
3. Framework Preset: **Next.js** (rilevato automaticamente)
4. Root Directory: `/` (radice del repo)

### 4.2 Variabili d'ambiente
In **Settings** > **Environment Variables**, aggiungi:

| Nome | Valore | Ambienti |
|------|--------|----------|
| `MONGODB_URI` | `mongodb+srv://...` | Production, Preview |
| `NEXTAUTH_URL` | `https://tuo-dominio.vercel.app` | Production |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Production, Preview |
| `R2_ENDPOINT` | `https://<ID>.r2.cloudflarestorage.com` | Production |
| `R2_ACCESS_KEY_ID` | (da Cloudflare) | Production |
| `R2_SECRET_ACCESS_KEY` | (da Cloudflare) | Production |
| `R2_BUCKET` | `gestionale-docs` | Production |

> **ATTENZIONE**: non committare mai `.env.local` nel repository.

### 4.3 Deploy
1. Click **Deploy**
2. Attendi il primo build (2-4 minuti)
3. Vercel assegna URL: `gestionale-xyz.vercel.app`

---

## 5. POST-DEPLOY

### 5.1 Crea primo admin
```bash
# Locally, con le env di produzione nel terminale:
MONGODB_URI="mongodb+srv://..." npm run seed:admin
# oppure
npm run create:admin
```

### 5.2 Popola dati demo (opzionale)
```bash
npm run seed:data
```

### 5.3 Verifica
- [ ] Login funzionante su `https://tuo-dominio.vercel.app/login`
- [ ] Sidebar mostra anagrafiche seed
- [ ] Upload documento (richiede R2 configurato)
- [ ] Calendario crea evento
- [ ] Notifiche campanellina funzionante
- [ ] Pannello Controllo accessibile solo con admin

---

## 6. DOMINIO CUSTOM (opzionale)

1. Vercel > **Settings** > **Domains** > Add domain
2. Configura DNS: aggiungi record CNAME `@` → `cname.vercel-dns.com`
3. Aggiorna `NEXTAUTH_URL` con il nuovo dominio

---

## 7. MONITORING

### Vercel Analytics
Abilita in **Settings** > **Analytics** (free tier: 2500 eventi/mese)

### MongoDB Atlas Monitoring
- **Clusters** > **Metrics**: monitora connessioni, operazioni/sec, latenza
- Imposta alerting su: connections > 80, disk > 80%

---

## 8. AGGIORNAMENTI

### Deploy automatici
Ogni push su `main` triggera un nuovo deploy automatico su Vercel.

### Migrazioni DB
Non sono previste migrazioni automatiche — Mongoose gestisce lo schema on-demand.
Se si aggiungono nuovi indici critici, eseguire manualmente:
```bash
MONGODB_URI="..." node -e "require('./scripts/ensure-indexes.js')"
```

---

## 9. TROUBLESHOOTING

| Problema | Soluzione |
|----------|-----------|
| `MONGODB_URI non definita` | Controlla variabili env in Vercel |
| Build fallisce su `auth.ts` | Verifica che non vengano importati moduli mongoose nel middleware |
| Upload documenti 503 | R2 non configurato — aggiungi variabili `R2_*` |
| Login redirect loop | `NEXTAUTH_URL` non corrisponde al dominio reale |
| Sidebar vuota | MongoDB connection error — controlla Network Access su Atlas |
