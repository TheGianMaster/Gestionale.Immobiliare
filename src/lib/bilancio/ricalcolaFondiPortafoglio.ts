/**
 * src/lib/bilancio/ricalcolaFondiPortafoglio.ts
 * Motore di ricalcolo del modulo Bilancio (T-114).
 *
 * `fondi_disponibili` (su Portafogli) e `totale_restituito` (su Debiti) sono
 * campi DERIVATI: non vanno mai scritti a mano, solo dalle funzioni qui sotto,
 * che li ricalcolano leggendo i movimenti reali (Ricavi, Spese, Trasferimenti).
 *
 * Formule esatte: vedi docs/12-BILANCIO.md §6.1 (fondi_disponibili) e §6.3 (totale_restituito).
 *
 * NOTA IMPORTI: questo file usa import RELATIVI (non l'alias "@/") perché deve
 * essere eseguibile sia dalle API route Next.js sia dallo script CLI
 * scripts/ricalcola-fondi.ts via tsx, dove l'alias "@/" non è garantito
 * risolvibile (gli script esistenti del progetto lo evitano sistematicamente).
 */

import { getSchedaModel } from '../../models/Scheda'

// ── Tipi ─────────────────────────────────────────────────────────────────────

interface RigaFondoImporto {
  fondo?: { id?: string; label?: string }
  importo?: number
}

interface RigaDestinazioneTrasferimento {
  portafoglio?: { id?: string; label?: string }
  importo?: number
}

export interface RisultatoRicalcoloPortafoglio {
  portafoglioId: string
  fondiDisponibili: number | null
  avvisi: string[]
}

export interface RisultatoRicalcoloDebito {
  debitoId: string
  totaleRestituito: number | null
  avvisi: string[]
}

// ── Helper ───────────────────────────────────────────────────────────────────

function numero(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function arrotonda(v: number): number {
  return Math.round(v * 100) / 100
}

// ── Ricalcolo fondi_disponibili (singolo portafoglio) ─────────────────────────

/**
 * Ricalcola e salva `fondi_disponibili` per un singolo portafoglio, sommando
 * tutti i movimenti reali collegati (ricavi incassati, spese pagate,
 * trasferimenti in entrata/uscita). Ritorna il nuovo valore.
 *
 * Movimenti inconsistenti (es. riferiscono un portafoglio inesistente, o hanno
 * un importo non numerico) vengono ignorati silenziosamente in questa funzione
 * a livello di singola riga; per un log esplicito degli avvisi usare la
 * variante batch `ricalcolaFondiTuttiIPortafogli`.
 */
export async function ricalcolaFondiPortafoglio(portafoglioId: string): Promise<number> {
  const [SchedaPortafogli, SchedaRicavi, SchedaSpese, SchedaTrasferimenti] = await Promise.all([
    getSchedaModel('portafogli'),
    getSchedaModel('ricavi'),
    getSchedaModel('spese'),
    getSchedaModel('trasferimenti'),
  ])

  const portafoglio = await SchedaPortafogli.findById(portafoglioId).lean()
  if (!portafoglio) {
    throw new Error(`Portafoglio ${portafoglioId} non trovato`)
  }

  let totale = 0

  // + Ricavi incassati con una destinazione su questo portafoglio
  const ricavi = await SchedaRicavi.find({
    attiva: true,
    'dati.stato_ricavo': 'incassata',
    'dati.fondi_destinazione.fondo.id': portafoglioId,
  }).lean()

  for (const r of ricavi) {
    const righe = ((r.dati as Record<string, unknown>)?.fondi_destinazione ?? []) as RigaFondoImporto[]
    for (const riga of righe) {
      if (riga?.fondo?.id === portafoglioId) totale += numero(riga.importo)
    }
  }

  // − Spese pagate con una provenienza da questo portafoglio
  const spese = await SchedaSpese.find({
    attiva: true,
    'dati.stato_spesa': 'pagata',
    'dati.fondi_provenienza.fondo.id': portafoglioId,
  }).lean()

  for (const s of spese) {
    const righe = ((s.dati as Record<string, unknown>)?.fondi_provenienza ?? []) as RigaFondoImporto[]
    for (const riga of righe) {
      if (riga?.fondo?.id === portafoglioId) totale -= numero(riga.importo)
    }
  }

  // + Trasferimenti in entrata (destinazione == questo portafoglio)
  const trasferimentiIn = await SchedaTrasferimenti.find({
    attiva: true,
    'dati.destinazioni.portafoglio.id': portafoglioId,
  }).lean()

  for (const t of trasferimentiIn) {
    const righe = ((t.dati as Record<string, unknown>)?.destinazioni ?? []) as RigaDestinazioneTrasferimento[]
    for (const riga of righe) {
      if (riga?.portafoglio?.id === portafoglioId) totale += numero(riga.importo)
    }
  }

  // − Trasferimenti in uscita (origine == questo portafoglio)
  const trasferimentiOut = await SchedaTrasferimenti.find({
    attiva: true,
    'dati.portafoglio_origine.id': portafoglioId,
  }).lean()

  for (const t of trasferimentiOut) {
    totale -= numero((t.dati as Record<string, unknown>)?.importo_totale)
  }

  const fondiDisponibili = arrotonda(totale)

  await SchedaPortafogli.updateOne(
    { _id: portafoglioId },
    { $set: { 'dati.fondi_disponibili': fondiDisponibili } }
  )

  return fondiDisponibili
}

/**
 * Variante batch: ricalcola `fondi_disponibili` per TUTTI i portafogli attivi.
 * Non lancia mai eccezioni per un singolo portafoglio problematico: logga un
 * warning in console e nel risultato, e continua con gli altri.
 */
export async function ricalcolaFondiTuttiIPortafogli(): Promise<RisultatoRicalcoloPortafoglio[]> {
  const SchedaPortafogli = await getSchedaModel('portafogli')
  const portafogli = await SchedaPortafogli.find({ attiva: true }).lean()

  const risultati: RisultatoRicalcoloPortafoglio[] = []

  for (const p of portafogli) {
    const portafoglioId = String(p._id)
    try {
      const fondiDisponibili = await ricalcolaFondiPortafoglio(portafoglioId)
      risultati.push({ portafoglioId, fondiDisponibili, avvisi: [] })
    } catch (e) {
      const messaggio = e instanceof Error ? e.message : String(e)
      console.warn(`[ricalcolaFondiTuttiIPortafogli] Portafoglio ${portafoglioId} ignorato: ${messaggio}`)
      risultati.push({ portafoglioId, fondiDisponibili: null, avvisi: [messaggio] })
    }
  }

  return risultati
}

// ── Ricalcolo totale_restituito (singolo debito) ───────────────────────────────

/**
 * Ricalcola e salva `totale_restituito` per un singolo debito, sommando tutte
 * le spese "pagata" che lo referenziano tramite `abbattimento_debito`.
 * (Formula: docs/12-BILANCIO.md §6.3. Il campo simmetrico `aumento_debito`
 * NON è gestito qui: vedi nota aperta in §6.3, non era oggetto di questa sessione.)
 */
export async function ricalcolaTotaleRestituitoDebito(debitoId: string): Promise<number> {
  const [SchedaDebiti, SchedaSpese] = await Promise.all([
    getSchedaModel('debiti'),
    getSchedaModel('spese'),
  ])

  const debito = await SchedaDebiti.findById(debitoId).lean()
  if (!debito) {
    throw new Error(`Debito ${debitoId} non trovato`)
  }

  const speseAbbattimento = await SchedaSpese.find({
    attiva: true,
    'dati.stato_spesa': 'pagata',
    'dati.abbattimento_debito.id': debitoId,
  }).lean()

  let totaleRestituito = 0
  for (const s of speseAbbattimento) {
    totaleRestituito += numero((s.dati as Record<string, unknown>)?.importo_totale)
  }
  totaleRestituito = arrotonda(totaleRestituito)

  await SchedaDebiti.updateOne(
    { _id: debitoId },
    { $set: { 'dati.totale_restituito': totaleRestituito } }
  )

  return totaleRestituito
}

/**
 * Variante batch: ricalcola `totale_restituito` per TUTTI i debiti attivi.
 * Stessa politica di tolleranza agli errori di `ricalcolaFondiTuttiIPortafogli`.
 */

export async function ricalcolaTotaleRestituitoTuttiIDebiti(): Promise<RisultatoRicalcoloDebito[]> {
  const SchedaDebiti = await getSchedaModel('debiti')
  const debiti = await SchedaDebiti.find({ attiva: true }).lean()

  const risultati: RisultatoRicalcoloDebito[] = []

  for (const d of debiti) {
    const debitoId = String(d._id)
    try {
      const totaleRestituito = await ricalcolaTotaleRestituitoDebito(debitoId)
      risultati.push({ debitoId, totaleRestituito, avvisi: [] })
    } catch (e) {
      const messaggio = e instanceof Error ? e.message : String(e)
      console.warn(`[ricalcolaTotaleRestituitoTuttiIDebiti] Debito ${debitoId} ignorato: ${messaggio}`)
      risultati.push({ debitoId, totaleRestituito: null, avvisi: [messaggio] })
    }
  }

  return risultati
}

// ── Ricalcolo "a cascata" da una Scheda Ricavi/Spese/Trasferimenti ────────────

function idsPortafoglioDaDati(anagraficaSlug: string, dati: Record<string, unknown> | undefined | null): string[] {
  if (!dati) return []
  const ids = new Set<string>()

  if (anagraficaSlug === 'ricavi') {
    const righe = (dati.fondi_destinazione ?? []) as RigaFondoImporto[]
    for (const r of righe) if (r?.fondo?.id) ids.add(r.fondo.id)
  }

  if (anagraficaSlug === 'spese') {
    const righe = (dati.fondi_provenienza ?? []) as RigaFondoImporto[]
    for (const r of righe) if (r?.fondo?.id) ids.add(r.fondo.id)
  }

  if (anagraficaSlug === 'trasferimenti') {
    const origine = dati.portafoglio_origine as { id?: string } | undefined
    if (origine?.id) ids.add(origine.id)
    const righe = (dati.destinazioni ?? []) as RigaDestinazioneTrasferimento[]
    for (const r of righe) if (r?.portafoglio?.id) ids.add(r.portafoglio.id)
  }

  return [...ids]
}

function idsDebitoDaDatiSpesa(dati: Record<string, unknown> | undefined | null): string[] {
  if (!dati) return []
  const ids = new Set<string>()
  const abbattimento = dati.abbattimento_debito as { id?: string } | undefined
  if (abbattimento?.id) ids.add(abbattimento.id)
  return [...ids]
}

export interface EsitoImpattoScheda {
  portafogliRicalcolati: string[]
  debitiRicalcolati: string[]
  errori: string[]
}

/**
 * Da richiamare dopo create/update/delete di una Scheda con anagraficaSlug in
 * ['ricavi','spese','trasferimenti'] — le uniche che referenziano un Portafoglio
 * e influenzano `fondi_disponibili`/`totale_restituito` (T-114, TODO esplicito
 * "richiamata automaticamente ovunque si crei/modifichi/elimini un movimento").
 *
 * Best-effort: non lancia mai eccezioni, logga gli errori e li ritorna nel
 * risultato invece di propagarli, cosi' il chiamante (route API) puo' decidere
 * se e come segnalarli senza che un fallimento di ricalcolo faccia fallire
 * un'operazione CRUD gia' avvenuta con successo.
 *
 * `datiPrima`/`datiDopo`: passare entrambi su update (per ricalcolare sia i
 * portafogli/debiti referenziati PRIMA della modifica sia quelli DOPO, nel
 * caso l'utente abbia cambiato portafoglio/debito); solo `datiDopo` su create
 * (`datiPrima: null`); solo `datiPrima` su delete (`datiDopo: null`).
 */
export async function ricalcolaImpattoScheda(
  anagraficaSlug: string,
  datiPrima: Record<string, unknown> | undefined | null,
  datiDopo: Record<string, unknown> | undefined | null,
): Promise<EsitoImpattoScheda> {
  if (!['ricavi', 'spese', 'trasferimenti'].includes(anagraficaSlug)) {
    return { portafogliRicalcolati: [], debitiRicalcolati: [], errori: [] }
  }

  const portafoglioIds = new Set<string>([
    ...idsPortafoglioDaDati(anagraficaSlug, datiPrima),
    ...idsPortafoglioDaDati(anagraficaSlug, datiDopo),
  ])
  const debitoIds = new Set<string>([
    ...idsDebitoDaDatiSpesa(datiPrima),
    ...idsDebitoDaDatiSpesa(datiDopo),
  ])

  const errori: string[] = []
  const portafogliRicalcolati: string[] = []
  const debitiRicalcolati: string[] = []

  for (const id of portafoglioIds) {
    try {
      await ricalcolaFondiPortafoglio(id)
      portafogliRicalcolati.push(id)
    } catch (e) {
      const msg = `Portafoglio ${id}: ${e instanceof Error ? e.message : String(e)}`
      console.warn(`[ricalcolaImpattoScheda] ${msg}`)
      errori.push(msg)
    }
  }

  for (const id of debitoIds) {
    try {
      await ricalcolaTotaleRestituitoDebito(id)
      debitiRicalcolati.push(id)
    } catch (e) {
      const msg = `Debito ${id}: ${e instanceof Error ? e.message : String(e)}`
      console.warn(`[ricalcolaImpattoScheda] ${msg}`)
      errori.push(msg)
    }
  }

  return { portafogliRicalcolati, debitiRicalcolati, errori }
}
