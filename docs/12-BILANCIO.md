# 📊 DOC-12 — BILANCIO
> **Leggi questo file per:** T-110 e sezioni bilancio future
> **File chiave:** `src/app/(dashboard)/bilancio/`, `src/components/layout/Sidebar.tsx`

---

## 1. STRUTTURA ATTUALE

```
/bilancio/overview    ← route attiva, placeholder "Work in progress"
```

**Sidebar:** Sezione "BILANCIO" (collassabile, hardcoded via `SezioneFissa`).
- Voce: "Overview" → icona `BarChart2` da lucide-react

---

## 2. COMPONENTE SEZIONEFISSA (Sidebar)

`SezioneFissa` in `src/components/layout/Sidebar.tsx` gestisce sezioni statiche non provenienti dal DB layout:

```typescript
// Props
{
  label: string                                          // testo header sezione (UPPERCASE automatico via CSS)
  collapsed: boolean                                     // modalità icone
  items: { href: string; label: string; icon: React.ElementType }[]
  onNavClick?: () => void                                // chiude drawer mobile
}

// Comportamento collapsed:
// → separatore hr + VoceNav per ogni item (senza testo, solo icona)

// Comportamento expanded:
// → header collassabile con ChevronDown + VoceNav per ogni item
```

**Quando usare `SezioneFissa` vs nodi da DB:**
- `SezioneFissa` → sezioni statiche dell'applicazione (Bilancio, future sezioni di sistema)
- Nodi da DB (`layoutNodes`) → sezioni configurabili dall'utente (Anagrafiche, ordine sidebar)

---

## 3. AGGIUNGERE VOCI ALLA SEZIONE BILANCIO

In `src/components/layout/Sidebar.tsx`, trovare il blocco:
```tsx
<SezioneFissa
  label="Bilancio"
  collapsed={collapsed}
  items={[{ href: '/bilancio/overview', label: 'Overview', icon: BarChart2 }]}
  onNavClick={onClose}
/>
```

Aggiungere voci nell'array `items`. Per ogni voce:
1. Creare la route in `src/app/(dashboard)/bilancio/{nome}/page.tsx`
2. Aggiungere `{ href: '/bilancio/{nome}', label: '{Label}', icon: IconaLucide }` all'array

---

## 4. ROUTE ATTIVE

| Route | File | Stato |
|-------|------|-------|
| `/bilancio/overview` | `src/app/(dashboard)/bilancio/overview/page.tsx` | 🚧 WIP (placeholder) |

---

## 5. SCHEMA DATI CONFERMATO (T-111)

> Ricognizione fatta leggendo `scripts/import-anagrafiche.ts` (fonte di verità delle anagrafiche dinamiche) e `src/app/api/automazioni/nuovo-debito/route.ts` (unico consumer esistente di Portafogli/Debiti/Ricavi). Tutte le anagrafiche sotto sono del sistema generico Anagrafica+Scheda (`AnagraficaConfig` + `Variabile` + `getSchedaModel(slug)`), **non** modelli Mongoose dedicati.

### 5.1 Portafogli (`slug: 'portafogli'`)

| Campo | Tipo | Note |
|---|---|---|
| `titolo` | text, obbligatorio | |
| `sottotitolo` | text | |
| `descrizione` | text-area | |
| `debito_associato` | reference → `debiti` | **singolo**, non multiplo |
| `data_apertura` | data | |
| `data_chiusura` | data | |
| `fondi_disponibili` | numbers (decimali) | **Campo derivato — da qui in avanti scritto SOLO dal motore di ricalcolo (T-114), mai a mano** |

### 5.2 Debiti (`slug: 'debiti'`)

| Campo | Tipo | Note |
|---|---|---|
| `titolo` | text, obbligatorio | |
| `referente` | reference → `rubrica` | |
| `tipo_debito` | select | `mutuo, prestito, finanziamento, infruttifero, altro` |
| `tipo_tasso` | select | `alla francese, altro` |
| `totale_addebitato` | numbers | |
| `tasso_interesse` | numbers | |
| `rata_mensile` | numbers | |
| `importo_erogato` | numbers | |
| `data_apertura` | data | |
| `scadenza_prevista` | data | |
| `totale_restituito` | numbers | **Campo derivato dal T-112 (§6.3) — scritto dal motore di ricalcolo** |
| `note` | text-area | |

**⚠️ Correzione rispetto al roadmap:** non esiste un campo `casa_riferimento` nello schema Debiti, ma `src/app/api/automazioni/nuovo-debito/route.ts` (riga ~107) lo scrive comunque in `dati` se `casaRiferimento` è presente nel body. Essendo `Scheda.dati` un campo `Mixed`, la scrittura non genera errori ma il campo non è "ufficialmente" definito (non compare tra le `Variabile` dell'anagrafica, quindi non è editabile/visibile dalla UI generica schede). Non è nello scope di questa roadmap Bilancio correggerlo, ma va tenuto presente: se in futuro serve un riferimento Debito→Casa, va aggiunto come `Variabile` vera e propria.

### 5.3 Ricavi (`slug: 'ricavi'`)

| Campo | Tipo | Note |
|---|---|---|
| `titolo` | text, obbligatorio | |
| `importo_totale` | numbers | |
| `fondi_destinazione` | **line-items**, colonne: `fondo` (reference → `portafogli`), `importo` (numbers) | Un ricavo può essere ripartito su **più** portafogli |
| `casa` | reference → `case` | |
| `descrizione` | text-area | |
| `stato_ricavo` | select | `simulata, prevista, incassata, annullata` — **solo `incassata` rappresenta denaro reale** |
| `affittuario` | reference → `affittuari` | |
| `tipo_ricavo` | select | `affitto camera, affitto garage, vendita immobile, debito` |
| `data` | data | |
| `crediti` | reference → `crediti` | |

### 5.4 Spese (`slug: 'spese'`)

**L'anagrafica esiste già** (contrariamente all'incertezza segnalata nel roadmap in T-111).

| Campo | Tipo | Note |
|---|---|---|
| `titolo` | text, obbligatorio | |
| `importo_totale` | numbers | |
| `fondi_provenienza` | **line-items**, colonne: `fondo` (reference → `portafogli`), `importo` (numbers) | **Correzione rispetto al roadmap**: una spesa può uscire da **più** portafogli (line-items), non da uno solo come ipotizzato in §"Decisioni architetturali proposte" punto 2 del roadmap |
| `casa` | reference → `case` | |
| `descrizione` | text-area | |
| `stato_spesa` | select | `prevista, ipotizzata, pagata, annullata` — **solo `pagata` rappresenta denaro reale** |
| `fornitore` | reference → `rubrica` | |
| `tipo_spesa` | select | `acquisto immobile, mobili, lavori, permessi e certificazioni, lavoretti interni, riparazioni, assicurazione, altro` |
| `abbattimento_debito` | reference → `debiti` | **Il concetto di "abbattimento debito" esiste già**, è un semplice riferimento opzionale su Spese (non un tipo di movimento a parte) |
| `aumento_debito` | reference → `debiti` | Simmetrico ad `abbattimento_debito`: una spesa che aumenta il capitale di un debito |
| `data` | data | |

### 5.5 Affittuari / Contratti / Case — NON sono placeholder

**Correzione importante rispetto al roadmap**: le anagrafiche `affittuari`, `contratti` e `case` **esistono già e sono complete**, non è necessario alcun placeholder per T-119/T-124 (che restano comunque nella Fascia 2/3, fuori scope di questa sessione, ma vanno ripianificati come collegamento reale invece che placeholder puro):

- `affittuari`: nome, cognome, cellulare, mail, garanti (multi-ref → rubrica), data_nascita, luogo_nascita, codice_fiscale, entrato_il, uscita_prevista, caparra_versata, contratto (multi-ref → contratti), note.
- `contratti`: casa (ref → case, obbligatorio), data_stipulazione, tipo_contratto, scadenza, canone_mensile, canone_mensile_pulizie, canone_mensile_utenze, affittuari (multi-ref → affittuari), cedolare_secca.
- `case`: via, mq, prezzo_acquisto, quota_agenzia, agenzia, notaio, vecchi_proprietari, costo_atto_notarile, imposte_pagate, rendita_catastale, valore_catastale, imu_annuale, data_rogito, affittuari (multi-ref), garage_affittato_a (ref).

Un affittuario "attivo" può essere derivato leggendo `affittuari` dove `uscita_prevista` è nulla o futura rispetto a oggi (da affinare in T-119).

### 5.6 Template visivo — nota tecnica

Il file `Bilancio-template.html` (ora in `docs/bilancio/`) **non è un template con placeholder `{{ variabile }}` testuali** come descritto nel roadmap: è un bundle HTML/JS compilato ("Bundled Page", ~470KB, una sola riga minificata). La struttura concettuale descritta nel roadmap (viste `isMainView`/`isPortfolioView`/`isDebtView`, colori semantici) resta valida come riferimento (verificata via ricerca testuale delle stringhe "Fondi disponibili", "Debiti in corso", "Restituito", "Residuo" nel bundle), ma l'estrazione pixel-per-pixel del markup andrà fatta con più attenzione nei ticket UI (T-120+), leggendo/eseguendo il bundle invece di cercare placeholder testuali.

---

## 6. MODELLO DATI BILANCIO — DEFINITIVO (T-112)

### 6.1 Formula di calcolo `fondi_disponibili` (per portafoglio)

```
fondi_disponibili(P) =
  + Σ ricavi.fondi_destinazione[i].importo         dove fondi_destinazione[i].fondo.id == P.id  AND ricavo.stato_ricavo == 'incassata'
  − Σ spese.fondi_provenienza[i].importo            dove fondi_provenienza[i].fondo.id == P.id   AND spesa.stato_spesa == 'pagata'
  + Σ trasferimenti.destinazioni[i].importo         dove destinazioni[i].portafoglio.id == P.id
  − Σ trasferimenti.importo_totale                  dove trasferimenti.portafoglio_origine.id == P.id
```

Solo i movimenti "reali" (ricavi `incassata`, spese `pagata`, tutti i trasferimenti — che sono sempre reali per definizione, eseguiti atomicamente da T-115) contribuiscono al saldo. Ricavi/spese in stato `simulata`/`prevista`/`ipotizzata` sono previsionali e NON alterano `fondi_disponibili` (potranno alimentare in futuro una vista "previsionale" separata, fuori scope).

Movimenti con `fondo.id`/`portafoglio.id` che puntano a un portafoglio inesistente (cancellato) vengono loggati come warning e ignorati — non devono far fallire il ricalcolo (vedi T-114).

### 6.2 Anagrafica dinamica `trasferimenti` — schema campo-per-campo

**Decisione utente (sostituisce T-112/T-113 del roadmap originale):** `TrasferimentoFondi` **non** è un modello Mongoose dedicato, ma una nuova anagrafica dinamica `trasferimenti`, coerente con il pattern usato da tutte le altre entità del gestionale (Portafogli, Debiti, Ricavi, Spese, ecc.), aggiunta a `scripts/import-anagrafiche.ts` ed eseguibile con `npm run import:anagrafiche`.

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `titolo` | text | sì | Auto-generato lato API T-115, es. `"Portafoglio A → Portafoglio B, C"` |
| `portafoglio_origine` | reference → `portafogli` | sì | |
| `destinazioni` | line-items, colonne: `portafoglio` (reference → `portafogli`), `importo` (numbers) | sì | Una o più righe |
| `importo_totale` | numbers | sì | Deve coincidere con la somma di `destinazioni[].importo` |
| `data` | data | sì | |
| `note` | text-area | no | |

Icona: `ArrowLeftRight` · Colore: `#3B82F6` (azzurro, vedi §6.4) · `previewColumns: ['titolo']` · `ordine: 10`.

**Nota architetturale importante:** essendo un'anagrafica generica (`Scheda.dati` è `Mixed`), lo schema Mongoose **non può** validare a livello di DB che "la somma delle destinazioni coincida con l'importo totale" o che "origine ≠ destinazione" o "fondi sufficienti". Queste regole (previste nei criteri di accettazione originali di T-113) si spostano interamente lato API in **T-115** (Fascia 2, fuori scope di questa sessione), con lo stesso pattern già usato in `src/app/api/automazioni/nuovo-debito/route.ts` (validazione manuale nel route handler + codici errore `ERR_*`).

### 6.3 Formula di calcolo `totale_restituito` (Debiti)

**Decisione utente:** calcolato automaticamente dal motore di ricalcolo (non più manuale).

```
totale_restituito(D) = Σ spese.importo_totale   dove spesa.abbattimento_debito.id == D.id  AND spesa.stato_spesa == 'pagata'
```

**Nota aperta (non decisa in questa sessione, da confermare quando si affronterà `aumento_debito` in un ticket futuro):** esiste un campo simmetrico `aumento_debito` su Spese, che concettualmente dovrebbe incrementare `totale_addebitato` del debito con la stessa logica. Non è stato implementato in T-114 perché non era oggetto della domanda di chiarimento posta all'utente — il motore attuale calcola solo `totale_restituito`. Da confermare prima di toccare `totale_addebitato`.

### 6.4 Tabella colori movimenti

| Tipo movimento | Colore | Riferimento |
|---|---|---|
| Ricavo | `#10B981` (verde) | già nel template |
| Spesa | `#EF4444` (rosso) | già nel template |
| Abbattimento debito (uscita da portafoglio verso un debito) | `#D97706` su sfondo `#FFFBEB`/`#FDE68A` | già nel template |
| Trasferimento fondi | `#3B82F6` (azzurro) | `palette.info.DEFAULT` in `src/styles/palette.ts` — coincide già con il colore proposto nel roadmap, nessuna nuova entry necessaria in `palette.ts` |
| Brand/indigo | `#6366F1` | `palette.brand[500]` |

Per i colori **per-istanza** (uno spicchio per ogni portafoglio nel donut, un colore per ogni debito nella card) non esiste ancora una convenzione: si propone di riusare `palette.eventi` (8 colori, già usato per il Calendario) ciclando per indice — da confermare/implementare in T-120/T-121 (fuori scope di questa sessione).

### 6.5 Definizione di "ultimo movimento" (lista unificata)

Unione di:
- Ricavi con `stato_ricavo != 'annullata'`
- Spese con `stato_spesa != 'annullata'`
- Trasferimenti (tutti, non hanno un concetto di stato/annullamento in questa iterazione)

Ordinamento: `data` decrescente; a parità di `data`, `createdAt` decrescente (secondario, per stabilità dell'ordine). L'implementazione concreta (`src/lib/bilancio/aggregaMovimenti.ts`) è T-116, fuori scope di questa sessione.

### 6.6 Connessione DB

Non più rilevante come decisione separata: `src/lib/mongodb-anagrafiche.ts` usa già la stessa connessione di `src/lib/mongodb.ts` (`MONGODB_URI` unico, nessun cluster separato). L'anagrafica `trasferimenti` vive quindi nella stessa connessione di tutte le altre, collection `schede_trasferimenti`.

---

## 7. MOTORE DI RICALCOLO (T-114)

File: `src/lib/bilancio/ricalcolaFondiPortafoglio.ts`

Esporta:
- `ricalcolaFondiPortafoglio(portafoglioId: string): Promise<number>` — ricalcola e salva `fondi_disponibili` per un portafoglio, applicando la formula §6.1
- `ricalcolaFondiTuttiIPortafogli(): Promise<RisultatoRicalcolo[]>` — variante batch, non lancia mai eccezioni per un singolo portafoglio inconsistente (logga warning e continua con gli altri)
- `ricalcolaTotaleRestituitoDebito(debitoId: string): Promise<number>` — applica la formula §6.3
- `ricalcolaTotaleRestituitoTuttiIDebiti(): Promise<RisultatoRicalcoloDebito[]>` — variante batch

**Nota su import:** il file usa import relativi (`../../models/Scheda`) invece dell'alias `@/`, perché deve essere eseguibile sia dalle API route Next.js (dove `@/` funziona) sia dallo script CLI `scripts/ricalcola-fondi.ts` via `tsx` (dove gli script esistenti del progetto — `import-anagrafiche.ts`, `reset-schede.ts` — evitano sistematicamente `@/`, presumibilmente perché non risolto in modo affidabile fuori dal build Next.js).

**Chi deve richiamare queste funzioni (TODO esplicito per T-115/API esistenti):** al momento **nessun endpoint le richiama ancora**. Quando in Fascia 2 (T-115) verrà creata l'API trasferimento, e se esistono già endpoint di creazione/modifica Ricavi/Spese, andranno agganciate lì. Per ora sono disponibili anche via script CLI:

```
npm run ricalcola:fondi
```

(aggiunto a `package.json`). Come da nota tecnica generale del roadmap, questo script va lanciato dall'utente nel terminale Windows, non dalla sandbox Linux di questa sessione.

### 7.1 Aggiornamento (2026-07-03): ricalcolo "on-read", non solo "on-write"

Il bug segnalato dall'utente su "Nuovo Debito" (Ricavo corretto ma `fondi_disponibili` a 0) ha mostrato il limite dell'approccio "solo on-write": se un punto di scrittura futuro dimentica di richiamare il motore di ricalcolo, il valore mostrato resta stantio finché qualcuno non lancia `npm run ricalcola:fondi` a mano.

Su richiesta esplicita dell'utente, `GET /api/bilancio/overview`, `GET /api/bilancio/portafoglio/[id]` e `GET /api/bilancio/debito/[id]` ora **ricalcolano sempre "al volo" leggendo Ricavi/Spese/Trasferimenti reali ogni volta che la pagina viene aperta**, invece di fidarsi ciecamente del valore persistito su `dati.fondi_disponibili`/`dati.totale_restituito`:

- `overview`: chiama `ricalcolaFondiTuttiIPortafogli()` + `ricalcolaTotaleRestituitoTuttiIDebiti()` prima di leggere i portafogli/debiti da mostrare.
- `portafoglio/[id]`: chiama `ricalcolaFondiPortafoglio(id)` (+ `ricalcolaTotaleRestituitoDebito` per il debito associato, se presente) prima di costruire la risposta.
- `debito/[id]`: chiama `ricalcolaTotaleRestituitoDebito(id)` (+ `ricalcolaFondiPortafoglio` per il portafoglio collegato, se presente).

Ogni chiamata è avvolta in try/catch: se il ricalcolo fallisce (es. errore di rete verso il DB), si ricade sul valore persistito invece di rompere la pagina.

Il ricalcolo scrive comunque il valore aggiornato su `dati.*` (stesso comportamento del motore, T-114), quindi il campo persistito resta allineato dopo ogni apertura della pagina — è un effetto collaterale utile, non lo scopo primario.

**Perché non è stato tolto l'aggancio "on-write"** (route generiche schede + T-115 + fix `nuovo-debito`): garantisce che il valore sia corretto anche per eventuali altri consumer futuri che leggessero `dati.fondi_disponibili` direttamente dal DB senza passare da queste API. Le due strategie sono complementari, non alternative: "on-write" mantiene il dato sempre fresco appena possibile, "on-read" garantisce che sia comunque corretto anche se un punto di scrittura futuro dimenticasse di chiamarlo (difesa in profondità).

**Costo:** ogni apertura di `/bilancio/overview` ora fa N ricalcoli di portafogli + M ricalcoli di debiti (ognuno con query aggiuntive su Ricavi/Spese/Trasferimenti), invece di una singola lettura. Per i volumi tipici di questo gestionale è trascurabile; se in futuro i volumi crescessero molto, andrebbe rivalutato (es. cache con invalidazione mirata).

