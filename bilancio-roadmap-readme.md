# 🧾 BILANCIO — ROADMAP & CONTROL README

> **Documento di controllo per Claude Code — modulo Bilancio.**
> Questo file è il seguito operativo della `FASE 12: BILANCIO` già presente nel `README.md` principale del repository (ticket `T-110`, stato `Done`). Leggi PRIMA questo documento, poi apri il sub-README `docs/12-BILANCIO.md` per i dettagli tecnici via via che li produci. Non modificare mai la struttura dei ticket senza aggiornare stato e note.

---

## 📌 COME FUNZIONA QUESTO DOCUMENTO

Ogni ticket ha **esattamente 3 stati possibili**:

- `🔴 Da fare` — non ancora iniziato
- `🟡 In attesa di convalida` — sviluppato, in attesa che l'utente lo testi e approvi
- `🟢 Done` — approvato dall'utente e chiuso

**Regola non negoziabile:** quando sposti un ticket a `🟡 In attesa di convalida`, DEVI compilare per intero:

- **Note sviluppo** → cosa hai fatto, quali scelte tecniche hai preso e perché, eventuali deviazioni da questo documento
- **Modifiche utente** → lasciare vuoto finché l'utente non richiede correzioni; poi elencarle qui
- **File toccati** → percorso completo di ogni file creato/modificato

Non passare mai un ticket a `🟢 Done` da solo: quello stato lo assegna l'utente dopo aver testato. Il massimo che puoi fare autonomamente è `🟡 In attesa di convalida`.

Non saltare l'ordine dei ticket se non è esplicitamente indicato come parallelizzabile: le dipendenze sono vincolanti perché ogni ticket successivo assume che i dati/le funzioni del precedente esistano già.

---

## 🎯 OBIETTIVO DEL MODULO

Costruire la sezione **Bilancio → Overview** del gestionale immobiliare, sostituendo il placeholder "Work in progress" creato in `T-110`, con:

1. **Grafico a torta "Fondi disponibili"** — ripartizione dei fondi tra i portafogli, alimentato da un **motore di ricalcolo automatico** che legge spese, ricavi e trasferimenti (non un valore inserito manualmente).
2. **Card "Debiti in corso"** — stato di rimborso di ogni debito attivo, con barra di progresso (già disegnata nel template allegato).
3. **Ultimi movimenti** — lista unificata di spese (rosso), ricavi (verde) e trasferimenti interni tra portafogli (colore dedicato, vedi §5.4), sotto le due card sopra.
4. **Funzione "Sposta fondi"** — permette di spostare fondi da un portafoglio a uno o più portafogli di destinazione (es. 10.000€ arrivati su Portafoglio A vengono in seguito redistribuiti su Portafoglio B e C). Questi spostamenti **non sono spese né ricavi** (non alterano il patrimonio complessivo) ma devono comparire nello storico movimenti con una veste grafica distinta.
5. **Lista Affittuari attivi** — chi è attualmente in affitto e in quale casa. Può essere un **placeholder** in questa iterazione: struttura pronta, dati mock o vuoti, da collegare quando esisterà l'anagrafica dedicata.
6. **Viste di dettaglio** — click su un portafoglio → dettaglio movimenti di quel portafoglio; click su un debito → dettaglio movimenti legati a quel debito. Entrambe già disegnate nel template allegato.

Il criterio di completamento dell'intera roadmap è: **l'utente apre `/bilancio/overview`, vede dati reali (non mock) coerenti con le anagrafiche esistenti, può spostare fondi tra portafogli e vede tutto riflettersi correttamente nel grafico, nelle card e nello storico movimenti.**

---

## 📎 DOCUMENTO DI RIFERIMENTO VISIVO — TEMPLATE HTML

L'utente ha fatto produrre a Claude (Design) un template HTML/mock (`Bilancio-template.html`) partendo dal design system già esistente nel gestionale (stessa sidebar, stesso header, stessa palette). **Prima di scrivere una sola riga di UI, apri e leggi questo file per intero.**

**Percorso atteso nel repository:** l'utente deve salvare il file in `docs/bilancio/Bilancio-template.html`. Se non lo trovi lì, chiedi conferma del percorso prima di procedere — non improvvisare un layout alternativo.

### Cosa contiene il template (riassunto strutturale, verificalo comunque tu stesso aprendo il file)

- **Vista principale** (`isMainView`): due card affiancate (`grid-template-columns:1fr 1fr`)
  - Card sinistra **"Fondi disponibili"**: donut chart su `<canvas>` con label centrale (totale), sotto una lista dei portafogli con pallino colore, nome, importo formattato e quota percentuale. Riga cliccabile → apre il dettaglio portafoglio.
  - Card destra **"Debiti in corso"**: per ogni debito, badge percentuale, sottotitolo, barra di progresso colorata, importi restituiti/erogati/residui, scadenza. Riga cliccabile → apre il dettaglio debito.
- **Vista dettaglio Portafoglio** (`isPortfolioView`): header con nome/tipo/mutuo/data apertura, 4 metriche (fondi disp., debito associato, tot. ricavi, tot. spese), banner ambra opzionale se ci sono "abbattimenti debito" usciti dal portafoglio, e lista movimenti del portafoglio.
- **Vista dettaglio Debito** (`isDebtView`): header con nome/referente/tipo/tasso, 6 metriche (erogato, restituito, residuo, apertura, scadenza, rata), barra di progresso grande, riferimento al portafoglio collegato, lista movimenti legati al debito.
- **Navigazione**: tutto avviene **senza cambiare route** — è uno switch di stato client-side (`isMainView` / `isPortfolioView` / `isDebtView`) con un pulsante "Torna al bilancio" (`backToMain`) e animazioni CSS già definite nel template:
  ```css
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes slideInRight { from { opacity:0; transform:translateX(24px) } to { opacity:1; transform:translateX(0) } }
  ```
  Vista principale e dettaglio debito → `fadeIn`. Dettaglio portafoglio → `slideInRight`. Replica questo comportamento esattamente.
- **Colori semantici già presenti nel template** (da riusare, non reinventare):
  - Verde ricavi: `#10B981`
  - Rosso spese: `#EF4444`
  - Ambra "abbattimento debito" (uscita dal portafoglio verso un debito): `#D97706` su sfondo `#FFFFBEB`/`#FDE68A`
  - Brand/indigo: `#6366F1` (coerente con `palette.ts`, T-003)
  - Neutri: `#111827` testo primario, `#6B7280`/`#9CA3AF` testo secondario, `#E5E7EB` bordi, `#F9FAFB` sfondo pagina, `#F3F4F6` sfondo barre

Il template usa placeholder in stile `{{ variabile }}` e cicli `<sc-for>`/`<sc-if>`: sono **pseudo-codice del mock**, non vanno copiati letteralmente — vanno tradotti in JSX/React reale secondo le convenzioni già in uso nel resto del progetto (vedi `PreviewTable.tsx`, `SchedaView.tsx` come riferimento di stile del codice).

**Vincolo di design:** non introdurre componenti, spaziature, font-size o colori che non siano già presenti nel template o in `palette.ts`/`tokens.ts`. Se manca qualcosa di specifico (es. colore per i trasferimenti, vedi §5.4), scegli un valore coerente con la palette esistente e documentalo nelle Note sviluppo del ticket in cui lo introduci.

---

## 🧠 DECISIONI ARCHITETTURALI — AGGIORNATE DOPO T-111/T-112 (2026-07-03)

> ⚠️ Questa sezione è stata **verificata e corretta** contro il codice reale (`scripts/import-anagrafiche.ts`, `src/app/api/automazioni/nuovo-debito/route.ts`) in T-111/T-112. Le correzioni rispetto alle ipotesi originali sono marcate **[CORRETTO]**. Dettagli completi in `docs/12-BILANCIO.md` §5-§7.

1. **`fondi_disponibili` non si modifica mai a mano.** Confermato. Implementato in `src/lib/bilancio/ricalcolaFondiPortafoglio.ts` (T-114). Formula esatta in `docs/12-BILANCIO.md` §6.1.
2. **[CORRETTO] Le Spese referenziano i portafogli tramite `fondi_provenienza`, un campo `line-items` (non un singolo reference come ipotizzato).** L'anagrafica "Spese" esiste già (non era da creare) ed è simmetrica ai Ricavi: `fondi_provenienza: [{ fondo: {id,label}, importo }]` — **una spesa può uscire da più portafogli**, non da uno solo. Esistono anche già `abbattimento_debito` e `aumento_debito` (reference singolo → `debiti`) come campi opzionali sulla Spesa: il concetto di "abbattimento debito" **non è un tipo di movimento a parte**, è semplicemente una Spesa con quel riferimento valorizzato.
3. **[CORRETTO] Lo spostamento fondi è una nuova ANAGRAFICA DINAMICA `trasferimenti`, non un modello Mongoose dedicato.** Decisione utente (2026-07-03): coerenza con il pattern generico Anagrafica+Scheda usato da tutto il resto del gestionale, invece di un modello Mongoose su misura come originariamente scritto in T-112/T-113. Schema campo-per-campo in `docs/12-BILANCIO.md` §6.2. Le validazioni (somma destinazioni = totale, origine ≠ destinazione, fondi sufficienti) non potendo stare nello schema Mongoose (che è generico/Mixed) si spostano interamente in T-115 (API), non ancora implementato in questa sessione. Non deve mai comparire nei totali "Tot. ricavi" / "Tot. spese" del dettaglio portafoglio, ma deve comparire nella lista movimenti generale e in quella del portafoglio.
4. **Colore trasferimenti: azzurro `#3B82F6`.** Confermato — coincide con `palette.info.DEFAULT` già esistente in `src/styles/palette.ts`, nessuna nuova entry necessaria.
5. **[CORRETTO] La sezione Affittuari NON è un caso di dati mancanti.** Le anagrafiche `affittuari`, `contratti` e `case` **esistono già e sono complete** (nome/cognome, garanti, contratto→casa, canone, ecc.). T-119/T-124 andranno ripianificati come collegamento reale ai dati esistenti, non come placeholder puro — restano comunque fuori scope in questa sessione (Fascia 2/3).
6. **[NUOVO] `totale_restituito` (su Debiti) è calcolato automaticamente**, non inserito a mano. Decisione utente (2026-07-03). Formula: somma delle Spese `pagata` con `abbattimento_debito` che punta a quel debito. Implementato in T-114. Il campo simmetrico `aumento_debito`/`totale_addebitato` **non è stato gestito** in questa sessione (nota aperta, vedi `docs/12-BILANCIO.md` §6.3).
7. **[NUOVO] Il template HTML non è un template con placeholder testuali `{{ variabile }}`**, ma un bundle HTML/JS compilato a riga unica (~470KB). La struttura concettuale (viste, colori) resta valida come riferimento, ma l'estrazione del markup nei ticket UI (T-120+) andrà fatta diversamente da quanto originariamente previsto (leggendo/eseguendo il bundle, non cercando placeholder testuali).

---

## 🏗️ STACK TECNOLOGICO (invariato, nessuna nuova dipendenza necessaria)

Il grafico a torta va realizzato con **Canvas 2D nativo** (`<canvas>` + `getContext('2d')`), esattamente come nel template (`<canvas ref="{{ chartRef }}">`). **Non aggiungere Chart.js, Recharts o altre librerie di charting**: nessuna è presente nelle dipendenze del progetto (T-002) e un donut semplice a 3-6 spicchi non la giustifica. Se in un ticket ritieni indispensabile una libreria, fermati e chiedi conferma esplicita all'utente prima di installarla.

Tutto il resto dello stack (Next.js 16 App Router, TypeScript, Mongoose, TailwindCSS via CSS variables, Zod, date-fns, lucide-react) resta quello già in uso nel progetto.

---

## 📁 FILE TARGET AGGIUNTIVI

```
gestionale/
├── docs/
│   ├── 12-BILANCIO.md                              ← da aggiornare/espandere (fonte di verità tecnica del modulo)
│   └── bilancio/
│       └── Bilancio-template.html                  ← template visivo di riferimento (fornito dall'utente)
│
├── src/
│   ├── app/
│   │   ├── (dashboard)/bilancio/overview/page.tsx  ← sostituisce il placeholder T-110
│   │   └── api/
│   │       └── bilancio/
│   │           ├── overview/route.ts               ← GET dati aggregati vista principale
│   │           ├── portafoglio/[id]/route.ts        ← GET dettaglio movimenti portafoglio
│   │           ├── debito/[id]/route.ts             ← GET dettaglio movimenti debito
│   │           ├── trasferimento/route.ts           ← POST nuovo trasferimento fondi
│   │           └── affittuari/route.ts              ← GET lista affittuari attivi (placeholder)
│   │
│   ├── components/
│   │   └── bilancio/
│   │       ├── FondiDisponibiliChart.tsx           ← donut chart canvas
│   │       ├── DebitiInCorsoCard.tsx
│   │       ├── UltimiMovimentiList.tsx
│   │       ├── SpostaFondiModal.tsx
│   │       ├── AffittuariList.tsx
│   │       ├── PortafoglioDettaglio.tsx
│   │       └── DebitoDettaglio.tsx
│   │
│   │   (niente nuovo modello Mongoose: "trasferimenti" è un'anagrafica dinamica,
│   │    vedi scripts/import-anagrafiche.ts — decisione utente 2026-07-03, T-113)
│   │
│   └── lib/
│       └── bilancio/
│           ├── ricalcolaFondiPortafoglio.ts          ← motore di ricalcolo fondi
│           └── aggregaMovimenti.ts                   ← unifica spese/ricavi/trasferimenti ordinati per data
```

I nomi sono indicativi: se le convenzioni reali del repo (che dovrai verificare in `T-111`) suggeriscono un percorso diverso, seguile e documenta lo scostamento nelle Note sviluppo.

---

## 🗺️ ROADMAP & TIMELINE

La timeline è espressa in **sessioni di lavoro** (non giorni di calendario), poiché l'esecuzione è affidata a Claude Code in sessioni discrete. Ogni fascia corrisponde a un gruppo di ticket che ha senso convalidare insieme.

| Fascia | Ticket | Contenuto | Sessioni stimate |
|---|---|---|---|
| **1. Fondamenta dati** | T-111 → T-114 | Ricognizione schema reale, decisioni definitive, modello Trasferimento, motore di ricalcolo fondi | 2-3 |
| **2. Backend API** | T-115 → T-119 | API trasferimento, overview aggregata, dettaglio portafoglio/debito, affittuari | 2 |
| **3. UI — Vista principale** | T-120 → T-124 | Grafico a torta, card debiti, lista movimenti, modale sposta fondi, sezione affittuari | 2-3 |
| **4. UI — Viste di dettaglio** | T-125 → T-126 | Dettaglio portafoglio, dettaglio debito | 1-2 |
| **5. Assemblaggio & QA** | T-127 → T-128 | Pagina finale integrata, test end-to-end, checklist di convalida utente | 1-2 |

**Regola di convalida:** l'utente può testare progressivamente fascia per fascia (non serve aspettare la fine di tutto), ma i ticket dentro una fascia vanno rispettati in ordine per via delle dipendenze dirette tra loro.

---

## 📋 TICKET — FASE 12 (continuazione): BILANCIO — OVERVIEW

---

### T-111 — Ricognizione schema dati reale (Spese, Ricavi, Portafogli, Debiti)

**Stato:** `🟢 Done` **Priorità:** 🔴 Critica **Dipendenze:** nessuna **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Prima di progettare qualunque cosa, verifica lo stato reale del codice e (se raggiungibile) del database. Non fidarti delle ipotesi elencate in "Decisioni architetturali proposte" sopra: confermale o correggile con dati alla mano.

**Criteri di accettazione:**
- [ ] Individuato e letto lo schema Mongoose reale di `Portafogli` (`src/models/AnagraficaConfig` + relative `Variabile` per lo slug `portafogli`, oppure modello dedicato se esiste)
- [ ] Individuato e letto lo schema reale di `Debiti`
- [ ] Individuato e letto lo schema reale di `Ricavi`, confermato il campo `fondi_destinazione` e la sua forma esatta (`[{ fondo: {id, label}, importo }]`)
- [ ] Verificata l'esistenza dell'anagrafica `Spese`: se esiste, documentato il campo che collega una spesa a un portafoglio (nome esatto, tipo, se singolo o multiplo); se non esiste, segnalato chiaramente come blocco e proposta una soluzione (es. crearla, o dedurre le spese da un'altra fonte)
- [ ] Verificato se esiste già un concetto di "abbattimento debito" come tipo di spesa/movimento (il template lo dà per assunto) e come è modellato oggi
- [ ] Verificata l'esistenza di un'anagrafica "Affittuari" o "Contratti Affitto"/"Case": se esiste, documentato lo schema; se no, confermato che T-124 sarà un placeholder puro
- [ ] Aggiornato `docs/12-BILANCIO.md` con lo schema reale trovato (sezione "Schema dati confermato")
- [ ] Se una delle ipotesi in questo documento risulta sbagliata, annotata la correzione qui sotto in "Note sviluppo" — **i ticket successivi vanno adattati di conseguenza prima di partire**

**Note sviluppo:** Ricognizione fatta leggendo `scripts/import-anagrafiche.ts` (fonte di verità reale delle anagrafiche) e `src/app/api/automazioni/nuovo-debito/route.ts`. Risultati completi in `docs/12-BILANCIO.md` §5. In sintesi: (1) l'anagrafica Spese esiste già; (2) `fondi_provenienza` su Spese è `line-items` (multi-portafoglio), non un reference singolo come ipotizzato; (3) `abbattimento_debito`/`aumento_debito` esistono già come reference opzionali su Spese; (4) Affittuari/Contratti/Case esistono già e sono complete, non serviranno placeholder puri; (5) trovato un campo `casa_riferimento` scritto da `nuovo-debito/route.ts` su Debiti ma non presente nello schema Variabile — segnalato come inconsistenza nota, non corretto (fuori scope Bilancio); (6) il template HTML è un bundle compilato, non un template con placeholder testuali. Vedi §"Decisioni architetturali" sopra per il dettaglio delle correzioni.

**Modifiche utente:** Convalidato dall'utente (2026-07-03), nessuna modifica richiesta.

**File toccati:** `docs/12-BILANCIO.md` (nuova sezione 5), `bilancio-roadmap-readme.md` (questo file)

---

### T-112 — Design definitivo del modello dati Bilancio

**Stato:** `🟢 Done` **Priorità:** 🔴 Critica **Dipendenze:** T-111 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Sulla base della ricognizione di T-111, fissa per iscritto (in `docs/12-BILANCIO.md`) il modello dati definitivo del modulo Bilancio: come si calcolano i fondi di un portafoglio, come è fatto un Trasferimento, quali colori/badge usare, come si aggregano i movimenti. Questo documento è la fonte di verità per tutti i ticket successivi: se durante lo sviluppo emerge la necessità di deviare da quanto scritto qui, va aggiornato prima di procedere.

**Criteri di accettazione:**
- [ ] `docs/12-BILANCIO.md` contiene una sezione "Formula di calcolo fondi disponibili" con la formula esatta (quali collection/campi entrano in + e quali in -)
- [ ] Contiene lo schema campo-per-campo del modello `TrasferimentoFondi` (nome definitivo dei campi, tipi, validazioni)
- [ ] Contiene la tabella colori definitiva per i tipi di movimento (ricavo, spesa, trasferimento, abbattimento debito) con riferimento a `palette.ts` — se serve aggiungere una nuova entry in `palette.ts`, farlo qui e documentarlo
- [ ] Contiene la definizione di "ultimo movimento" ai fini della lista unificata (quali collection, come si ordina, cosa succede in caso di stessa data)
- [ ] Confermato se `TrasferimentoFondi` va registrato sulla connessione principale o sul cluster anagrafiche (coerentemente con dove vivono Portafogli/Debiti/Ricavi)

**Note sviluppo:** Formula fondi_disponibili, schema `trasferimenti`, tabella colori e definizione "ultimo movimento" scritti in `docs/12-BILANCIO.md` §6. Decisione utente (2026-07-03): `TrasferimentoFondi` diventa un'anagrafica dinamica `trasferimenti` (non un modello Mongoose dedicato) — vedi §"Decisioni architetturali" punto 3. Di conseguenza le validazioni cross-campo (somma destinazioni = totale, origine ≠ destinazione, fondi sufficienti) non stanno a livello di schema DB ma si spostano interamente in T-115 (non implementato in questa sessione). Connessione DB: non più una decisione separata, `mongodb-anagrafiche.ts` usa già lo stesso `MONGODB_URI` di `mongodb.ts`. `totale_restituito` sui Debiti: deciso "calcolato automaticamente" (utente, 2026-07-03) — formula in §6.3, implementata in T-114. `aumento_debito`/`totale_addebitato` lasciati come nota aperta, non decisi.

**Modifiche utente:** Convalidato dall'utente (2026-07-03), nessuna modifica richiesta.

**File toccati:** `docs/12-BILANCIO.md` (nuova sezione 6)

---

### T-113 — Anagrafica dinamica `trasferimenti` *(adattato da "Modello Mongoose `TrasferimentoFondi`" — decisione utente 2026-07-03)*

**Stato:** `🟢 Done` **Priorità:** 🔴 Critica **Dipendenze:** T-112 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Crea gli spostamenti di fondi tra portafogli come nuova anagrafica dinamica `trasferimenti` (pattern Anagrafica+Scheda, coerente col resto del gestionale), invece del modello Mongoose dedicato originariamente previsto — vedi §"Decisioni architetturali" punto 3 e `docs/12-BILANCIO.md` §6.2 per la motivazione.

**Criteri di accettazione (adattati):**
- [x] Anagrafica `trasferimenti` aggiunta a `scripts/import-anagrafiche.ts` con lo schema definito in T-112 §6.2
- [x] Campi: `titolo`, `portafoglio_origine` (reference → portafogli), `destinazioni` (line-items: portafoglio + importo), `importo_totale`, `data`, `note`
- [ ] **Non applicabile così com'era**: validazione "somma destinazioni = importo totale" e "origine ≠ destinazione" — essendo un'anagrafica generica (`Scheda.dati: Mixed`) non c'è validazione a livello di schema Mongoose; si sposta in T-115 (API), fuori scope di questa sessione
- [ ] **Non applicabile**: index dedicati su `data`/`portafoglioOrigine.id`/`destinazioni.portafoglio.id` — `Scheda` ha solo indici generici (`anagraficaSlug`, `attiva`, `createdAt`, `tags`); se in futuro servono query più performanti su questi path, va aggiunto un ticket dedicato (nota di performance, non bloccante per i volumi attesi)
- [x] Nessun modello Mongoose dedicato da rendere hot-reload safe: il pattern `getSchedaModel('trasferimenti')` è già hot-reload safe (cache in `_schedaModels`, coerente con Portafogli/Debiti/Ricavi/Spese)
- [ ] **Ancora da eseguire dall'utente**: `npm run import:anagrafiche` sul terminale Windows per applicare la nuova anagrafica al DB (questa sessione ha solo modificato il file sorgente, non può eseguire script `tsx` nel proprio sandbox Linux — vedi note tecniche generali del roadmap)

**Note sviluppo:** Vedi `docs/12-BILANCIO.md` §6.2 per lo schema campo-per-campo completo e la motivazione della scelta anagrafica-dinamica-vs-Mongoose. **Azione richiesta all'utente prima di poter testare**: eseguire `npm run import:anagrafiche` in locale per creare l'`AnagraficaConfig`/`Variabile` di `trasferimenti` nel DB.

**Modifiche utente:** Convalidato dall'utente (2026-07-03). Nota: l'esecuzione effettiva di `npm run import:anagrafiche` sul DB reale resta a carico dell'utente (non eseguibile dalla sandbox di questa sessione) — vedi checklist "Stato Fascia 1" in fondo al documento.

**File toccati:** `scripts/import-anagrafiche.ts`

---

### T-114 — Motore di ricalcolo `fondi_disponibili`

**Stato:** `🟢 Done` **Priorità:** 🔴 Critica **Dipendenze:** T-113 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Funzione centrale che, dato un portafoglio, ricalcola e persiste il suo `fondi_disponibili` sommando tutti i movimenti collegati (ricavi, spese, trasferimenti in/out). È la funzione che rende il grafico a torta sempre coerente con la realtà, come richiesto esplicitamente dall'utente.

**Criteri di accettazione:**
- [ ] `src/lib/bilancio/ricalcolaFondiPortafoglio.ts` esporta `ricalcolaFondiPortafoglio(portafoglioId: string): Promise<number>` che ricalcola e salva il nuovo valore, e lo ritorna
- [ ] Formula applicata coerente con quanto fissato in T-112 (ricavi in entrata + trasferimenti in entrata − spese in uscita − trasferimenti in uscita − eventuali abbattimenti debito)
- [ ] Esposta anche una variante batch `ricalcolaFondiTuttiIPortafogli(): Promise<void>` per ricalcoli massivi (utile per uno script di riconciliazione una tantum)
- [ ] La funzione è **richiamata automaticamente** ovunque si crei/modifichi/elimini un movimento che tocca un portafoglio: va agganciata (o segnalata come TODO esplicito con riferimento al ticket) nei punti API esistenti di creazione Ricavi/Spese se già presenti, e nei nuovi endpoint di Trasferimento (T-115)
- [ ] Gestione esplicita del caso "portafoglio con movimenti inconsistenti" (es. spesa che referenzia un portafoglio inesistente): non deve far crashare il ricalcolo, va loggato un warning e ignorato quel movimento
- [ ] Script CLI opzionale `scripts/ricalcola-fondi.ts` che richiama la variante batch, utile per verifiche manuali dell'utente (coerente con gli altri script già presenti in `scripts/`)

**Note sviluppo:** Implementato in `src/lib/bilancio/ricalcolaFondiPortafoglio.ts`: `ricalcolaFondiPortafoglio`, `ricalcolaFondiTuttiIPortafogli` (formula §6.1), più `ricalcolaTotaleRestituitoDebito`/`ricalcolaTotaleRestituitoTuttiIDebiti` (formula §6.3, aggiunte per la decisione utente "calcolato automaticamente" — non erano nei criteri originali di questo ticket ma logicamente appartengono allo stesso motore). Import relativi (non `@/`) per compatibilità con esecuzione via `tsx` dallo script CLI, vedi commento in testa al file. **Aggiornamento (Fascia 2, 2026-07-03):** il TODO è stato chiuso — `ricalcolaImpattoScheda` (nuova funzione di orchestrazione in questo stesso file) è ora agganciata a `POST`/`PUT`/`DELETE` (singolo e bulk) di `src/app/api/anagrafiche/[slug]/schede/route.ts` e `.../schede/[id]/route.ts`, le route generiche che l'app usa per creare/modificare/eliminare Ricavi, Spese e Trasferimenti (non esistono endpoint dedicati per queste tre anagrafiche). È un no-op per tutte le altre anagrafiche. `T-115` la richiama inoltre direttamente per il flusso atomico di trasferimento. Script CLI creato in `scripts/ricalcola-fondi.ts` + comando `npm run ricalcola:fondi` in `package.json`. **Non eseguibile da questa sessione** (sandbox Linux, mismatch esbuild — vedi note tecniche generali): l'utente deve lanciarlo da terminale Windows dopo aver eseguito `npm run import:anagrafiche` (T-113) e con almeno un portafoglio/debito reale nel DB, per verificare che il ricalcolo produca i valori attesi.

**Modifiche utente:** Convalidato dall'utente (2026-07-03). Corretto anche un errore TS pre-esistente e non collegato al modulo Bilancio in `scripts/import-anagrafiche.ts:336` (cast del risultato di `.lean()`), segnalato dall'utente durante la revisione.

**File toccati:** `src/lib/bilancio/ricalcolaFondiPortafoglio.ts`, `scripts/ricalcola-fondi.ts`, `package.json`, `scripts/import-anagrafiche.ts` (fix tipo)

---

### T-115 — API `POST /api/bilancio/trasferimento`

**Stato:** `🟡 In attesa di convalida` **Priorità:** 🔴 Critica **Dipendenze:** T-113, T-114 **Sub-README:** `docs/12-BILANCIO.md`, `docs/11-AUTOMAZIONI.md`

**Descrizione:** Endpoint che esegue lo spostamento fondi in modo atomico: crea il record `TrasferimentoFondi` e ricalcola i portafogli coinvolti (origine + tutte le destinazioni). Segui lo stesso pattern di robustezza già usato per il wizard "Nuovo Debito" (`T-102`): validazione rigorosa, rollback in caso di errore parziale, codici errore chiari.

**Criteri di accettazione:**
- [ ] Riceve: `portafoglioOrigineId`, array di `{ portafoglioDestinazioneId, importo }`, note opzionali
- [ ] Validazione Zod lato server: importi positivi, almeno una destinazione, nessuna destinazione uguale all'origine, portafogli esistenti e attivi
- [ ] **Verifica fondi sufficienti**: l'importo totale richiesto non può superare `fondi_disponibili` correnti del portafoglio origine (ricalcolato al momento, non da valore stantio)
- [ ] Crea il record `TrasferimentoFondi`
- [ ] Richiama `ricalcolaFondiPortafoglio` su origine e su ogni destinazione
- [ ] Se un ricalcolo fallisce dopo la creazione del record, gestione errore esplicita (log + codice errore chiaro all'utente); non serve rollback distruttivo del trasferimento se il ricalcolo può essere ripetuto in modo idempotente, ma va comunque comunicato con un codice errore dedicato (es. `ERR_RICALCOLO_FONDI`)
- [ ] Codici errore coerenti con lo stile già in uso nel progetto (vedi `ERR_VALIDATION`, `ERR_ANA_PORTAFOGLI` ecc. in `T-102`): es. `ERR_AUTH`, `ERR_VALIDATION`, `ERR_FONDI_INSUFFICIENTI`, `ERR_PORTAFOGLIO_NON_TROVATO`, `ERR_CREATE_TRASFERIMENTO`, `ERR_RICALCOLO_FONDI`, `ERR_INTERNO`
- [ ] Route protetta da auth (middleware NextAuth esistente)
- [ ] Risposta di successo include il trasferimento creato e i nuovi saldi dei portafogli coinvolti (per aggiornare la UI senza un secondo round-trip)

**Note sviluppo:** Implementato in `src/app/api/bilancio/trasferimento/route.ts`. "Il record `TrasferimentoFondi`" del criterio originale è in realtà una Scheda dell'anagrafica dinamica `trasferimenti` (T-113). Fondi verificati chiamando `ricalcolaFondiPortafoglio` sull'origine PRIMA di creare il trasferimento (valore sempre fresco, mai stantio). Dopo la creazione, ricalcola origine + tutte le destinazioni; se un ricalcolo fallisce, ritorna `ERR_RICALCOLO_FONDI` con l'id del trasferimento già creato (non viene fatto rollback distruttivo, come da criterio — riconciliabile con `npm run ricalcola:fondi`). Codici errore: `ERR_AUTH`, `ERR_VALIDATION`, `ERR_ANA_TRASFERIMENTI`, `ERR_ANA_PORTAFOGLI`, `ERR_PORTAFOGLIO_NON_TROVATO`, `ERR_FONDI_INSUFFICIENTI`, `ERR_CREATE_TRASFERIMENTO`, `ERR_RICALCOLO_FONDI`, `ERR_INTERNO`.

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/app/api/bilancio/trasferimento/route.ts`

---

### T-116 — API `GET /api/bilancio/overview`

**Stato:** `🟡 In attesa di convalida` **Priorità:** 🔴 Critica **Dipendenze:** T-114 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Endpoint aggregato che fornisce tutti i dati necessari alla vista principale del Bilancio in un'unica chiamata: fondi per portafoglio (per il donut), totale generale, debiti attivi con percentuali, ultimi movimenti unificati.

**Criteri di accettazione:**
- [ ] `GET /api/bilancio/overview` ritorna:
  - `portafogli`: array `{ id, nome, colore, fondiDisponibili, share (%) }` — assegna un colore distinto per portafoglio, coerente con la palette (riusa/estendi la logica colori già usata per le anagrafiche in Sidebar, T-031)
  - `totaleFondi`: somma di tutti i `fondiDisponibili`
  - `debiti`: array `{ id, nome, referente, erogato, restituito, residuo, percentuale, scadenzaAnno, colore }`
  - `ultimiMovimenti`: array unificato (default: ultimi 10-15) di `{ id, tipo: 'ricavo'|'spesa'|'trasferimento', titolo, data, importo, colore, portafoglioCoinvolto }`, ordinato per data decrescente
- [ ] La lista movimenti unifica le tre fonti (Ricavi, Spese, TrasferimentoFondi) con una funzione di aggregazione dedicata (`src/lib/bilancio/aggregaMovimenti.ts`, vedi T-112 per la definizione)
- [ ] Nessun valore hardcoded/mock: tutti i numeri arrivano da query reali al database
- [ ] Route protetta da auth
- [ ] Gestione stato vuoto (nessun portafoglio, nessun debito) senza errori — la UI (T-120/T-121) deciderà come mostrarlo

**Note sviluppo:** Implementato in `src/app/api/bilancio/overview/route.ts`, usa `src/lib/bilancio/aggregaMovimenti.ts` (nuovo, condiviso anche da T-117/T-118). Colore per-portafoglio/per-debito: ciclo su `palette.eventi` (8 colori) per indice, come annotato in `docs/12-BILANCIO.md` §6.4 (non esisteva ancora una convenzione dedicata). `scadenzaAnno` estratto dai primi 4 caratteri di `scadenza_prevista`. Stati vuoti gestiti naturalmente (array vuoti, nessun errore).

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/app/api/bilancio/overview/route.ts`, `src/lib/bilancio/aggregaMovimenti.ts`

---

### T-117 — API `GET /api/bilancio/portafoglio/[id]`

**Stato:** `🟡 In attesa di convalida` **Priorità:** Alta **Dipendenze:** T-114 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Dati per la vista di dettaglio di un portafoglio (replica esatta della sezione `isPortfolioView` del template).

**Criteri di accettazione:**
- [ ] Ritorna: dati anagrafici del portafoglio (nome, tipo, mutuo/debito associato, data apertura), le 4 metriche (fondi disp., debito associato, tot. ricavi, tot. spese), eventuale riepilogo abbattimenti debito usciti dal portafoglio (per il banner ambra del template), e la lista completa dei movimenti di quel portafoglio (ricavi + spese + trasferimenti in/out) ordinata per data decrescente
- [ ] Ogni movimento nella lista include i campi necessari al template: icona/tipo, titolo, data, badge tipo, colore importo, flag `isAbbattimento` con referente se applicabile
- [ ] 404 chiaro se il portafoglio non esiste
- [ ] Route protetta da auth

**Note sviluppo:** Implementato in `src/app/api/bilancio/portafoglio/[id]/route.ts`. Il flag `isAbbattimento` per-movimento è già nel modello `Movimento` di `aggregaMovimenti.ts`; il banner ambra aggregato ("totaleAbbattimentiDebito") è calcolato a parte con una query dedicata su Spese (stato `pagata`, `abbattimento_debito` valorizzato, riga di `fondi_provenienza` su questo portafoglio).

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/app/api/bilancio/portafoglio/[id]/route.ts`

---

### T-118 — API `GET /api/bilancio/debito/[id]`

**Stato:** `🟡 In attesa di convalida` **Priorità:** Alta **Dipendenze:** T-111 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Dati per la vista di dettaglio di un debito (replica esatta della sezione `isDebtView` del template).

**Criteri di accettazione:**
- [ ] Ritorna: dati anagrafici del debito (nome, referente, tipo, tasso), le 6 metriche (erogato, restituito, residuo, apertura, scadenza, rata), percentuale/barra di rimborso, riferimento al portafoglio collegato con relativi fondi disponibili, e la lista dei movimenti legati a quel debito (tipicamente gli "abbattimenti debito") ordinata per data decrescente
- [ ] 404 chiaro se il debito non esiste
- [ ] Route protetta da auth

**Note sviluppo:** Implementato in `src/app/api/bilancio/debito/[id]/route.ts`. Il "portafoglio collegato" è una reverse lookup su `dati.debito_associato.id` (relazione 1:1 lato Portafoglio, nessun campo inverso su Debiti). `percentuale` = `restituito / (totale_addebitato || importo_erogato) * 100`.

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/app/api/bilancio/debito/[id]/route.ts`

---

### T-119 — API `GET /api/bilancio/affittuari` *(NON più placeholder — vedi Note sviluppo)*

**Stato:** `🟡 In attesa di convalida` **Priorità:** Bassa **Dipendenze:** T-111 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Endpoint per la lista affittuari attivi. In base a quanto trovato in `T-111`: se l'anagrafica esiste già, collegala per davvero; se non esiste, ritorna un array vuoto tipizzato correttamente, pronto per essere popolato in futuro senza modificare il contratto dell'API.

**Criteri di accettazione:**
- [ ] `GET /api/bilancio/affittuari` ritorna `{ affittuari: Array<{ id, nome, casa, dataInizio, dataFine? }> }`
- [ ] Se l'anagrafica dedicata non esiste ancora, ritorna `{ affittuari: [] }` con commento nel codice `// TODO: collegare a anagrafica Affittuari/Contratti quando disponibile (rif. T-111)`
- [ ] Route protetta da auth
- [ ] Il contratto della risposta è già quello definitivo, così la UI (T-124) non andrà toccata quando in futuro i dati reali verranno collegati

**Note sviluppo:** **Correzione rispetto al titolo/descrizione originale del ticket**: non è un placeholder, legge dati reali dalle anagrafiche `affittuari`/`case` già esistenti (vedi `docs/12-BILANCIO.md` §5.5). "Attivo" definito come `uscita_prevista` assente/vuota oppure ≥ oggi. La casa è risolta con una reverse lookup sul campo multi-reference `case.affittuari`. Se l'anagrafica non fosse presente in un ambiente, ritorna comunque `{ affittuari: [] }` con lo stesso contratto (mantenendo il comportamento placeholder-safe richiesto originariamente).

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/app/api/bilancio/affittuari/route.ts`

---

### T-120 — Componente grafico a torta "Fondi disponibili"

**Stato:** `🟡 In attesa di convalida` **Priorità:** 🔴 Critica **Dipendenze:** T-116 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Replica esatta della card sinistra della vista principale del template: donut chart su Canvas 2D nativo con label centrale, sotto la lista portafogli cliccabile.

**Criteri di accettazione:**
- [ ] `src/components/bilancio/FondiDisponibiliChart.tsx`
- [ ] Donut disegnato con `<canvas>` + Canvas 2D API (nessuna libreria di charting, vedi §Stack tecnologico)
- [ ] Un colore distinto per spicchio/portafoglio, coerente con `p.colore` ritornato dall'API
- [ ] Overlay centrale con label (es. "Totale") e valore formattato in euro
- [ ] Lista sotto il grafico: pallino colore, nome portafoglio, importo formattato, quota percentuale — hover coerente con lo stile già usato altrove nel progetto (righe cliccabili con hover leggero)
- [ ] Click su una riga → naviga alla vista di dettaglio portafoglio (T-125), senza reload di pagina
- [ ] Stato vuoto curato se non ci sono portafogli ("Nessun fondo disponibile" o simile, non un grafico rotto)
- [ ] Formattazione importi coerente con il resto del progetto (`Intl.NumberFormat` locale `it-IT`, valuta EUR)

**Note sviluppo:** Implementato in `src/components/bilancio/FondiDisponibiliChart.tsx`. Donut disegnato a mano su `<canvas>` (arc per spicchio, `lineWidth` fisso, nessuna libreria). Formattazione euro centralizzata in una nuova utility `formatEuro()` aggiunta a `src/lib/utils.ts` (accanto a `formatData()` già esistente, stesso pattern). Click riga → prop `onSelectPortafoglio?: (id: string) => void`, non ancora collegato a una navigazione reale perché la vista di dettaglio (T-125) non esiste ancora in questa sessione (Fascia 4); il componente è comunque pronto, va solo passato il callback da T-127.

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/components/bilancio/FondiDisponibiliChart.tsx`, `src/lib/utils.ts` (nuova `formatEuro`)

---

### T-121 — Card "Debiti in corso"

**Stato:** `🟡 In attesa di convalida` **Priorità:** 🔴 Critica **Dipendenze:** T-116 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Replica esatta della card destra della vista principale del template.

**Criteri di accettazione:**
- [ ] `src/components/bilancio/DebitiInCorsoCard.tsx`
- [ ] Per ogni debito: nome, badge percentuale rimborsato, sottotitolo, barra di progresso colorata con percentuale inline se lo spazio lo consente, importi restituiti/erogati/residui, scadenza
- [ ] Click su una riga → naviga alla vista di dettaglio debito (T-126)
- [ ] Stato vuoto curato se non ci sono debiti attivi
- [ ] Colori e badge coerenti con quanto già usato nel dettaglio debito esistente (se il progetto ha già una logica di colore per stato debito, riusala; altrimenti definiscila qui e documentala)

**Note sviluppo:** Implementato in `src/components/bilancio/DebitiInCorsoCard.tsx`. Non esisteva ancora una logica di colore per stato debito nel progetto: uso il `colore` per-istanza già calcolato lato API (T-116, ciclo su `palette.eventi`) sia per il badge percentuale sia per la barra di progresso, invece di introdurre una nuova palette semaforo (verde/ambra/rosso) non richiesta esplicitamente — se in convalida preferisci una palette a soglie di rischio, va corretto qui.

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/components/bilancio/DebitiInCorsoCard.tsx`

---

### T-122 — Sezione "Ultimi movimenti"

**Stato:** `🟡 In attesa di convalida` **Priorità:** 🔴 Critica **Dipendenze:** T-116 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Lista che appare **sotto** le due card (fondi disponibili + debiti in corso), come richiesto esplicitamente dall'utente. Mostra gli ultimi movimenti unificati: ricavi in verde, spese in rosso, trasferimenti fondi con il colore dedicato (azzurro, vedi §5.4/T-112).

**Criteri di accettazione:**
- [ ] `src/components/bilancio/UltimiMovimentiList.tsx`, posizionato nel layout **sotto** la griglia a due colonne delle card principali
- [ ] Ogni riga mostra: icona/indicatore colorato per tipo, titolo movimento, data, badge tipo (Ricavo/Spesa/Trasferimento), importo con segno e colore coerente (ricavo con `+` verde, spesa con `−` rosso, trasferimento neutro azzurro senza segno +/− dato che non altera il patrimonio totale)
- [ ] Per i trasferimenti, la riga chiarisce origine → destinazione/i (es. "Portafoglio A → Portafoglio B, C")
- [ ] Link/azione per vedere tutti i movimenti (anche solo un placeholder "Vedi tutti" se una vista movimenti estesa non è nello scope di questa roadmap — non bloccante)
- [ ] Stato vuoto curato se non ci sono movimenti recenti
- [ ] Stile coerente con le righe movimento già disegnate nel template (icona in box arrotondato, titolo + data + badge, importo a destra)

**Note sviluppo:** Implementato in `src/components/bilancio/UltimiMovimentiList.tsx`. "Vedi tutti" è un prop opzionale `onVediTutti` (se assente, il link non compare) — non esiste ancora una vista movimenti estesa, coerente col criterio "non bloccante". Per i trasferimenti il testo "origine → destinazioni" arriva già formattato dal campo `portafoglioCoinvolto` calcolato in `aggregaMovimenti.ts` (T-116), non ricalcolato qui.

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/components/bilancio/UltimiMovimentiList.tsx`

---

### T-123 — Funzione "Sposta fondi" (UI)

**Stato:** `🟡 In attesa di convalida` **Priorità:** 🔴 Critica **Dipendenze:** T-115 **Sub-README:** `docs/12-BILANCIO.md`, `docs/11-AUTOMAZIONI.md`

**Descrizione:** Interfaccia per eseguire uno spostamento di fondi tra portafogli, richiamando l'API di `T-115`. Punto di ingresso consigliato: pulsante "Sposta fondi" nell'header della pagina `/bilancio/overview` (accanto al titolo "Bilancio"), che apre una modale. Se durante lo sviluppo ritieni più coerente collocarla altrove (es. dentro `Pannello Controllo > Automazioni`, accanto al wizard "Nuovo Debito"), puoi farlo, ma documenta la scelta nelle Note sviluppo.

**Criteri di accettazione:**
- [ ] `src/components/bilancio/SpostaFondiModal.tsx`
- [ ] Step 1: selezione portafoglio di origine (mostra i fondi disponibili correnti accanto a ogni opzione)
- [ ] Step 2: una o più righe destinazione, ognuna con selezione portafoglio + importo; pulsante "Aggiungi destinazione"; non permettere di scegliere come destinazione lo stesso portafoglio già selezionato come origine o già presente in un'altra riga
- [ ] Totale destinazioni mostrato in tempo reale, con validazione visiva se supera i fondi disponibili dell'origine (blocco invio, messaggio chiaro)
- [ ] Submit → chiama `POST /api/bilancio/trasferimento`, gestisce stato loading ed errori (mappa i codici errore di T-115 in messaggi italiani, come già fatto per il login in `T-012`)
- [ ] Al successo: chiude la modale, aggiorna la vista overview senza reload completo (refetch o aggiornamento ottimistico dei saldi ritornati dall'API)
- [ ] Escape/click fuori chiude la modale (coerente con gli altri modali del progetto)

**Note sviluppo:** Implementato in `src/components/bilancio/SpostaFondiModal.tsx`, stile allineato a `NuovoDebitoWizard.tsx` (classi `.modal-backdrop`/`.modal-panel`/`.btn-*` già esistenti in `globals.css`, non nuove). Riceve `portafogli` come prop invece di fare una fetch propria (la pagina overview li ha già caricati con un'unica `GET /api/bilancio/overview`, evita una seconda chiamata). Mappa i codici errore di T-115 (`ERR_AUTH`, `ERR_VALIDATION`, `ERR_ANA_TRASFERIMENTI`, `ERR_ANA_PORTAFOGLI`, `ERR_PORTAFOGLIO_NON_TROVATO`, `ERR_FONDI_INSUFFICIENTI`, `ERR_CREATE_TRASFERIMENTO`, `ERR_RICALCOLO_FONDI`, `ERR_INTERNO`) in messaggi italiani. Al successo richiama `onSuccess(saldi)` e lascia alla pagina il refetch completo dell'overview (più semplice e robusto di un aggiornamento ottimistico parziale, dato che un trasferimento tocca anche `ultimiMovimenti`).

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/components/bilancio/SpostaFondiModal.tsx`

---

### T-124 — Sezione "Affittuari in affitto" *(NON più placeholder)*

**Stato:** `🟡 In attesa di convalida` **Priorità:** Bassa **Dipendenze:** T-119 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Lista degli affittuari attualmente in affitto con indicazione della casa, come richiesto dall'utente. Può restare un placeholder funzionale in questa iterazione.

**Criteri di accettazione:**
- [ ] `src/components/bilancio/AffittuariList.tsx`, posizionato in coda alla vista principale (sotto "Ultimi movimenti") o in una card dedicata — scegli il posizionamento più coerente con il layout del template e documentalo
- [ ] Consuma `GET /api/bilancio/affittuari` (T-119)
- [ ] Se la lista è vuota: stato vuoto esplicito e onesto ("Sezione in arrivo" o "Nessun affittuario configurato"), non un componente che sembra rotto o dimenticato
- [ ] Se in futuro arrivano dati reali, ogni riga mostra almeno: nome affittuario, casa/portafoglio associato, periodo di affitto
- [ ] Commento nel codice `// TODO: collegare ad anagrafica Affittuari quando disponibile (rif. T-111, T-119)`

**Note sviluppo:** **Correzione rispetto al titolo originale**: non è un placeholder, mostra dati reali da `GET /api/bilancio/affittuari` (T-119, già collegato ad anagrafiche esistenti). Il commento TODO richiesto dal criterio non è applicabile: rimosso perché il collegamento è già fatto, non serve più. Posizionato in coda alla vista, in una card dedicata (come Fondi/Debiti/Movimenti), coerente col resto del layout.

**Modifiche utente:** *(da compilare)*

**File toccati:** `src/components/bilancio/AffittuariList.tsx`

---

### T-125 — Vista di dettaglio Portafoglio (UI)

**Stato:** `🔴 Da fare` **Priorità:** Alta **Dipendenze:** T-117, T-120 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Replica esatta della sezione `isPortfolioView` del template.

**Criteri di accettazione:**
- [ ] `src/components/bilancio/PortafoglioDettaglio.tsx`
- [ ] Pulsante "Torna al bilancio" in alto, animazione `slideInRight` all'apertura (coerente con il template)
- [ ] Header con icona, nome, tipo/mutuo, data apertura
- [ ] Griglia 4 metriche: fondi disp., debito associato, tot. ricavi (verde), tot. spese (rosso)
- [ ] Banner ambra condizionale per abbattimenti debito usciti dal portafoglio (solo se presenti)
- [ ] Lista movimenti completa del portafoglio, stile coerente con "Ultimi movimenti" ma completa (non limitata a 10-15)
- [ ] Consuma `GET /api/bilancio/portafoglio/[id]` (T-117)

**Note sviluppo:** *(da compilare)*

**Modifiche utente:** *(da compilare)*

**File toccati:** *(da compilare)*

---

### T-126 — Vista di dettaglio Debito (UI)

**Stato:** `🔴 Da fare` **Priorità:** Alta **Dipendenze:** T-118, T-121 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Replica esatta della sezione `isDebtView` del template.

**Criteri di accettazione:**
- [ ] `src/components/bilancio/DebitoDettaglio.tsx`
- [ ] Pulsante "Torna al bilancio" in alto, animazione `fadeIn` all'apertura
- [ ] Header con nome, referente, tipo, tasso, nota opzionale
- [ ] Griglia 6 metriche: erogato, restituito, residuo, apertura, scadenza, rata
- [ ] Barra di progresso grande con percentuale rimborso, restituiti/residui sotto
- [ ] Riferimento al portafoglio collegato con fondi disponibili correnti
- [ ] Lista movimenti legati al debito
- [ ] Consuma `GET /api/bilancio/debito/[id]` (T-118)

**Note sviluppo:** *(da compilare)*

**Modifiche utente:** *(da compilare)*

**File toccati:** *(da compilare)*

---

### T-127 — Assemblaggio pagina `/bilancio/overview`

**Stato:** `🔴 Da fare` **Priorità:** 🔴 Critica **Dipendenze:** T-120, T-121, T-122, T-123, T-124, T-125, T-126 **Sub-README:** `docs/12-BILANCIO.md`, `docs/10-UI-LAYOUT.md`

**Descrizione:** Sostituisce il placeholder "Work in progress" creato in `T-110` con la pagina reale, che orchestra tutti i componenti precedenti e gestisce lo switch di stato tra vista principale, dettaglio portafoglio e dettaglio debito, esattamente come nel template (`isMainView` / `isPortfolioView` / `isDebtView`).

**Criteri di accettazione:**
- [ ] `src/app/(dashboard)/bilancio/overview/page.tsx` riscritta (sostituisce il placeholder)
- [ ] Layout fedele al template: titolo "Bilancio" + sottotitolo, pulsante "Sposta fondi" nell'header della vista principale, griglia due colonne (Fondi disponibili | Debiti in corso), sezione "Ultimi movimenti" sotto, sezione "Affittuari" in coda
- [ ] Switch di stato client-side tra le tre viste, senza cambio di route completo (coerente col template); considerare un query param opzionale (es. `?view=portafoglio&id=...`) per rendere condivisibile/back-button-friendly il deep link — se lo implementi, verifica che il pulsante "indietro" del browser si comporti in modo sensato
- [ ] Skeleton/loading state durante il fetch iniziale dei dati overview
- [ ] Breadcrumb header coerente con il resto del gestionale (Bilancio > Overview, già presente da T-110/T-032)
- [ ] Dopo un'operazione di "Sposta fondi" riuscita, la vista principale si aggiorna con i nuovi saldi senza richiedere un refresh manuale della pagina
- [ ] Nessun dato mock/hardcoded rimasto: tutto proviene dalle API costruite in questa roadmap

**Note sviluppo:** *(da compilare)*

**Modifiche utente:** *(da compilare)*

**File toccati:** *(da compilare)*

---

### T-128 — QA finale e checklist di convalida utente

**Stato:** `🔴 Da fare` **Priorità:** 🔴 Critica **Dipendenze:** T-127 **Sub-README:** `docs/12-BILANCIO.md`

**Descrizione:** Ultimo ticket della roadmap. Non introduce nuove funzionalità: verifica che tutto il modulo funzioni end-to-end e prepara una checklist puntuale che l'utente userà per validare manualmente il lavoro.

**Criteri di accettazione:**
- [ ] Verificato `npx tsc --noEmit` pulito sui file toccati (vedi nota tecnica sul mount Windows/CIFS in fondo a questo documento)
- [ ] Verificato che il ricalcolo fondi (`T-114`) resti coerente dopo una sequenza di operazioni miste: creazione ricavo → creazione spesa → trasferimento → nuova spesa (nessuna deriva numerica, nessun arrotondamento anomalo)
- [ ] Verificato comportamento responsive della pagina overview (desktop e, almeno a livello di non-rottura, viewport ridotta — coerente con l'impostazione mobile-first già usata altrove, es. `T-012`, `T-030`)
- [ ] Verificati tutti gli stati vuoti (nessun portafoglio, nessun debito, nessun movimento, nessun affittuario) senza errori a video
- [ ] Verificato che un trasferimento con fondi insufficienti venga bloccato con messaggio chiaro, sia lato client che lato server
- [ ] Prodotta in questo ticket (sezione Note sviluppo) una **checklist di convalida per l'utente**, in linguaggio non tecnico, con i passaggi concreti da testare a mano (es. "1. Apri Bilancio → Overview. 2. Verifica che il totale del grafico corrisponda alla somma dei portafogli. 3. Clicca su un portafoglio e controlla che i movimenti elencati corrispondano a quelli che ti aspetti. 4. Prova a spostare fondi tra due portafogli e verifica che il grafico si aggiorni. ...")
- [ ] Aggiornato `docs/12-BILANCIO.md` con lo stato finale del modulo e eventuali limiti noti (es. sezione affittuari ancora placeholder)

**Note sviluppo:** *(da compilare — qui va inserita anche la checklist di convalida utente richiesta sopra)*

**Modifiche utente:** *(da compilare)*

**File toccati:** *(da compilare)*

---

## ✅ CHECKLIST DI CONVALIDA FINALE (macro, per l'utente)

Da usare una volta che **tutti** i ticket sopra sono `🟡 In attesa di convalida`, prima di chiudere ciascuno a `🟢 Done`:

- [ ] Il totale mostrato al centro del grafico a torta corrisponde alla somma reale dei fondi di tutti i portafogli
- [ ] Ogni spicchio del grafico corrisponde a un portafoglio reale con l'importo corretto
- [ ] La card "Debiti in corso" mostra percentuali e importi coerenti con quanto già visibile altrove nel gestionale (es. nella scheda del debito in anagrafica)
- [ ] "Ultimi movimenti" mostra spese in rosso, ricavi in verde, trasferimenti in azzurro, con importi e segni corretti
- [ ] Spostando fondi da un portafoglio a due destinazioni, il grafico, la lista movimenti e i dettagli di tutti e tre i portafogli coinvolti si aggiornano correttamente
- [ ] Tentando un trasferimento con importo superiore ai fondi disponibili, il sistema blocca l'operazione con un messaggio chiaro
- [ ] Cliccando su un portafoglio si apre il dettaglio corretto con i suoi movimenti; "Torna al bilancio" funziona
- [ ] Cliccando su un debito si apre il dettaglio corretto con i suoi movimenti; "Torna al bilancio" funziona
- [ ] La sezione Affittuari non rompe la pagina anche se vuota
- [ ] L'aspetto visivo (colori, spaziature, font, animazioni) corrisponde al template `Bilancio-template.html` fornito

---

## ⚠️ NOTE TECNICHE GENERALI (richiamate dal README principale)

Valgono anche per questo modulo, non ripeterle qui ma tienile presenti:

- **Mount Bash/Windows**: il sandbox Linux monta la cartella Windows via CIFS in sola-scrittura-cached. Per file grandi, riscrivi sempre via `python3 -c "with open(...,'w') as f: f.write(content)"` dentro un heredoc, non fidarti di `wc -l`/`tsc` letti da bash su file appena modificati.
- **Script npm**: `tsx` non è eseguibile da bash nel sandbox (mismatch esbuild win32/linux). Tutti gli script `npm run *`, incluso l'eventuale `scripts/ricalcola-fondi.ts` di `T-114`, vanno eseguiti dall'utente nel terminale Windows.
- **Verifica TSC**: usa `npx tsc --noEmit 2>&1 | grep "src/" | grep -v "node_modules"` per ignorare rumore da `scripts/`.

---

## 📣 COME PROCEDERE ORA

1. Inizia da **T-111**: non toccare codice UI finché lo schema dati reale non è confermato.
2. Aggiorna questo file spuntando le caselle e cambiando lo stato ticket via via che avanzi, seguendo rigorosamente l'ordine di dipendenza.
3. Ferma ogni fascia della roadmap (vedi tabella Timeline) e segnala all'utente che è pronta per la convalida, invece di procedere fino in fondo senza checkpoint intermedi.
4. In caso di ambiguità tra questo documento e il template HTML, **vince il template per l'aspetto visivo** e **questo documento per la logica dati/architettura** — se sono in conflitto tra loro su qualcosa che riguarda entrambi, fermati e chiedi.

---

### ✅ Stato Fascia 1 (2026-07-03)

T-111 → T-114 completati e messi in `🟡 In attesa di convalida`. Prima di passare alla Fascia 2 (T-115 → T-119, API backend), l'utente deve:

1. Eseguire `npm run import:anagrafiche` da terminale Windows per creare l'anagrafica `trasferimenti` nel DB (T-113).
2. Verificare `npx tsc --noEmit` sui nuovi file (`src/lib/bilancio/ricalcolaFondiPortafoglio.ts`, `scripts/ricalcola-fondi.ts`, `scripts/import-anagrafiche.ts`) — non eseguibile dalla sandbox Linux di questa sessione.
3. Con almeno un Portafoglio/Debito/Ricavo/Spesa reali nel DB, eseguire `npm run ricalcola:fondi` e verificare che i valori calcolati abbiano senso.
4. Rivedere le correzioni segnate **[CORRETTO]**/**[NUOVO]** in "Decisioni architetturali" sopra, in particolare: anagrafica `trasferimenti` dinamica invece di modello Mongoose, `totale_restituito` calcolato automaticamente, `aumento_debito`/`totale_addebitato` non gestito (nota aperta).

Solo dopo questa convalida i ticket vanno spostati a `🟢 Done` e si può procedere con la Fascia 2.

---

### ✅ Stato Fascia 2 (2026-07-03)

T-115 → T-119 completati e messi in `🟡 In attesa di convalida`. Novità rispetto a quanto scritto originariamente nel roadmap:

- **T-114 chiuso per davvero**: il ricalcolo automatico è ora agganciato alle route generiche di Ricavi/Spese/Trasferimenti (vedi nota aggiornata sopra), non solo disponibile via script CLI.
- **T-119 non è più un placeholder**: legge dati reali da `affittuari`/`case` (che esistevano già, vedi T-111).
- Nuovo file condiviso `src/lib/bilancio/aggregaMovimenti.ts` (non era esplicitamente previsto come nome ma corrisponde a quanto anticipato in "File target aggiuntivi").

Prima di passare alla Fascia 3 (T-120 → T-124, UI vista principale), l'utente deve:

1. Eseguire `npm run import:anagrafiche` (se non già fatto per la Fascia 1) e verificare che ci siano almeno 2 portafogli, 1 debito, alcuni ricavi/spese reali nel DB per testare le API con dati veri.
2. Verificare `npx tsc --noEmit` sui nuovi file — controllato pulito da questa sessione (nessun errore su `src/app/api/bilancio/*` o `src/lib/bilancio/*`), ma vale la pena ricontrollare in locale.
3. Testare manualmente gli endpoint (es. con curl/Postman o dal browser per le GET, autenticati):
   - `GET /api/bilancio/overview`
   - `GET /api/bilancio/portafoglio/<id>`
   - `GET /api/bilancio/debito/<id>`
   - `GET /api/bilancio/affittuari`
   - `POST /api/bilancio/trasferimento` con un body tipo `{ "portafoglioOrigineId": "...", "destinazioni": [{ "portafoglioDestinazioneId": "...", "importo": 100 }] }`
4. Verificare che, dopo un trasferimento riuscito, `GET /api/bilancio/overview` rifletta i nuovi saldi.
5. Verificare che creare/modificare/eliminare un Ricavo o una Spesa dalla UI generica anagrafiche (`/anagrafica/ricavi`, `/anagrafica/spese`) aggiorni `fondi_disponibili` del portafoglio coinvolto senza bisogno di eseguire manualmente `npm run ricalcola:fondi`.

Solo dopo questa convalida si può procedere con la Fascia 3 (UI).

---

### ✅ Stato Fascia 3 (2026-07-03)

T-120 → T-124 completati e messi in `🟡 In attesa di convalida`. Tutti i componenti sono in `src/components/bilancio/` e ricevono i dati come props (nessuna fetch propria, tranne `SpostaFondiModal` che chiama l'API di T-115) — la pagina li orchestra con un'unica `GET /api/bilancio/overview` + `GET /api/bilancio/affittuari`.

**Deviazione dichiarata dal roadmap**: per permettere una convalida visiva reale (non solo componenti isolati non renderizzati da nessuna parte), `src/app/(dashboard)/bilancio/overview/page.tsx` è stata riscritta con un wiring "minimo" che sostituisce già il placeholder "Work in progress" di T-110 e mostra tutti e 5 i componenti con dati reali. **Non è però l'assemblaggio finale di T-127**: manca lo switch di stato verso le viste di dettaglio Portafoglio/Debito (T-125/T-126, Fascia 4, non ancora costruite in questa sessione), quindi cliccare su un portafoglio o un debito non fa ancora nulla — i componenti espongono già le prop `onSelectPortafoglio`/`onSelectDebito` pronte per essere collegate quando arriveranno T-125/T-126. `page.tsx` andrà toccata di nuovo in T-127 per aggiungere quello switch (oltre a skeleton di caricamento iniziale più curato e query param per i deep link, se scelti in quel ticket).

Prima di passare alla Fascia 4 (T-125 → T-126, viste di dettaglio), l'utente deve:

1. Aprire `/bilancio/overview` nel browser (con almeno un portafoglio/debito/ricavo/spesa/trasferimento reali nel DB) e verificare visivamente: il donut mostra gli spicchi corretti, il totale al centro corrisponde alla somma dei portafogli, la card debiti mostra percentuali/barre coerenti, "Ultimi movimenti" mostra ricavi verdi/spese rosse/trasferimenti azzurri con il segno giusto, "Affittuari attivi" mostra i dati reali (o lo stato vuoto se non ce ne sono).
2. Provare "Sposta fondi" end-to-end dalla UI: aprire la modale, selezionare origine e una o più destinazioni, verificare che il totale si aggiorni in tempo reale e che superare i fondi disponibili blocchi l'invio con un messaggio chiaro: dopo l'invio, verificare che la pagina si aggiorni da sola (grafico, card, movimenti) senza refresh manuale.
3. Verificare `npx tsc --noEmit` sui nuovi file — controllato pulito da questa sessione, ma vale la pena ricontrollare in locale, specialmente per JSX/Tailwind (la sandbox non esegue `next build`).
4. Controllo visivo di coerenza con lo stile del resto del gestionale (colori, bottoni, modale) — i componenti riusano le classi `.btn-*`/`.modal-*`/le CSS variable già esistenti in `globals.css`, non ne introducono di nuove.

Solo dopo questa convalida si può procedere con la Fascia 4 (viste di dettaglio Portafoglio/Debito).

---

### 🐛 Bug fix segnalato dall'utente (2026-07-03): fondi_disponibili a 0 dopo "Nuovo Debito"

**Sintomo riportato dall'utente:** un Portafoglio legato a un Debito (creato tramite il wizard "Nuovo Debito") mostrava `fondi_disponibili` a 0€ nel grafico a torta, nonostante un Ricavo di apertura da 7.000€ con `stato_ricavo: 'incassata'` puntasse correttamente a quel portafoglio.

**Causa reale:** `src/app/api/automazioni/nuovo-debito/route.ts` (endpoint pre-esistente, T-102) crea Debito, Portafogli e Ricavo **direttamente via `SchedaXxx.create()`**, bypassando le route generiche `/api/anagrafiche/[slug]/schede` a cui era stato agganciato il ricalcolo automatico (T-114/Fascia 2). Il TODO "richiamata automaticamente ovunque si crei un movimento" non copriva questo endpoint bespoke — un vero gap, non un problema del motore di ricalcolo in sé (la formula era corretta, semplicemente non veniva maii eseguita per questo percorso di creazione).

**Fix:** aggiunta chiamata a `ricalcolaFondiPortafoglio(portafogli._id)` subito dopo la creazione del Ricavo in `nuovo-debito/route.ts`, prima della risposta di successo. Best-effort: se il ricalcolo fallisce, il debito/portafogli/ricavo restano comunque creati correttamente e la risposta include un campo `avviso` che invita a eseguire `npm run ricalcola:fondi`.

**Verificato:** nessun altro endpoint sotto `src/app/api/automazioni/` crea Ricavi/Spese/Portafogli/Trasferimenti direttamente — `nuovo-debito` era l'unico caso.

**Azione per l'utente:** per i Debiti/Portafogli già creati PRIMA di questo fix (come quello segnalato), il valore `fondi_disponibilii non si aggiorna retroattivamente da solo — eseguire `npm run ricalcola:fondi` una volta per riconciliare tutti i portafogli/debiti esistenti.

**File toccati:** `src/app/api/automazioni/nuovo-debito/route.ts`

---

### 🔁 Miglioramento richiesto dall'utente (2026-07-03): ricalcolo "on-read" automatico

**Richiesta utente (testuale):** "si deve calcolare in automatico però. Ogni volta che vado sul bilancio deve prendere tutte le fonti di ricavo, spesa e trasferimenti che referenziano i portafogli e calcolare i fondi e dove sono, per poi mostrarli graficamente nel grafico."

**Motivazione:** il fix precedente (sopra) risolve il gap puntuale di `nuovo-debito`, ma resta un modello "on-write": se un futuro punto di scrittura dimentica di richiamare il motore di ricalcolo, il dato mostrato torna a essere stantio finché qualcuno non lancia `npm run ricalcola:fondi` a mano. L'utente ha chiesto una garanzia più forte: che l'apertura stessa della pagina Bilancio ricalcoli sempre i fondi dai movimenti reali.

**Implementato:** le tre GET del modulo Bilancio ora ricalcolano "al volo" ad ogni richiesta, prima di rispondere (dettagli tecnici in `docs/12-BILANCIO.md` §7.1):

- `GET /api/bilancio/overview` (T-116) → `ricalcolaFondiTuttiIPortafogli()` + `ricalcolaTotaleRestituitoTuttiIDebiti()`
- `GET /api/bilancio/portafoglio/[id]` (T-117) → `ricalcolaFondiPortafoglio(id)` (+ debito associato)
- `GET /api/bilancio/debito/[id]` (T-118) → `ricalcolaTotaleRestituitoDebito(id)` (+ portafoglio collegato)

Ogni chiamata è in try/catch con fallback sul valore persistito, così un errore di ricalcolo non rompe mai la pagina. Il ricalcolo scrive comunque il valore aggiornato su `dati.*`, quindi il dato persistito resta allineato dopo ogni apertura.

**Effetto pratico per il caso "zio daniele":** non è più necessario eseguire `npm run ricalcola:fondi` a mano per quel caso specifico — basta aprire `/bilancio/overview` (o la vista di dettaglio del portafoglio/debito) e il valore corretto viene ricalcolato e mostrato automaticamente. Lo script CLI resta comunque disponibile come strumento di riconciliazione manuale/batch.

**File toccati:** `src/app/api/bilancio/overview/route.ts`, `src/app/api/bilancio/portafoglio/[id]/route.ts`, `src/app/api/bilancio/debito/[id]/route.ts`, `docs/12-BILANCIO.md` (§7.1).

**Verifica:** `npx tsc --noEmit` pulito (nessun errore nuovo introdotto) sui 3 file modificati.

---

### 🐛 Bug fix segnalato dall'utente (2026-07-03): ricerca reference "non trova nulla" (spese → fondi_provenienza)

**Sintomo riportato dall'utente:** nella riga ripetibile "Fondi di provenienza" dell'anagrafica Spese, digitando nel campo di ricerca della colonna reference (verso Portafogli) non compariva mai alcun risultato, pur esistendo portafogli nel DB.

**Causa reale:** bug pre-esistente, non legato al modulo Bilancio in sé, ma che lo blocca in pratica. `GET /api/anagrafiche/[slug]/schede` restituisce `{ data: [...], meta: {...} }` (verificato coerente con `PreviewTable.tsx`, che infatti legge `json.data` correttamente). I tre componenti generici di ricerca reference — `ReferenceField.tsx`, `MultiReferenceField.tsx`, `LineItemsField.tsx` (usati da OGNI campo reference/multi-reference/riga-reference di TUTTE le anagrafiche, non solo Spese/Portafogli) — leggevano invece `data.schede`, un campo che l'API non ha mai restituito. Il risultato era sempre un array vuoto, indipendentemente dalla query digitata.

**Fix:** cambiato `data.schede` → `data.data` nei tre file (`ReferenceField.tsx`, `MultiReferenceField.tsx`, `LineItemsField.tsx`).

**Portata:** questo sblocca la ricerca reference ovunque nel gestionale (non solo Spese→Portafogli), inclusi Ricavi→fondi_destinazione e Trasferimenti→portafoglio_origine/destinazioni, entrambi rilevanti per il modulo Bilancio.

**File toccati:** `src/components/variabili/fields/ReferenceField.tsx`, `src/components/variabili/fields/MultiReferenceField.tsx`, `src/components/variabili/fields/LineItemsField.tsx`.

**Verifica:** `npx tsc --noEmit` pulito.
