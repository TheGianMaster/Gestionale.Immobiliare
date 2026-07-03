/**
 * scripts/ricalcola-fondi.ts
 * Ricalcola `fondi_disponibili` di tutti i portafogli e `totale_restituito`
 * di tutti i debiti, leggendo Ricavi/Spese/Trasferimenti reali dal DB
 * (motore di ricalcolo: src/lib/bilancio/ricalcolaFondiPortafoglio.ts, T-114).
 *
 * USO: npm run ricalcola:fondi
 *
 * Utile per una riconciliazione manuale una tantum (es. dopo aver importato
 * dati storici, o per verificare che non ci sia deriva numerica).
 *
 * NOTA: la libreria di ricalcolo importa modelli tramite path relativi (non
 * l'alias "@/"), e questo script importa quella libreria con `import()`
 * dinamico DOPO aver chiamato `dotenv.config()`. Questo evita un problema di
 * ordine di esecuzione: gli import statici vengono risolti/eseguiti prima del
 * resto del modulo, quindi se importassimo staticamente la libreria (che a
 * sua volta importa src/lib/mongodb.ts, il quale legge `process.env.MONGODB_URI`
 * al caricamento del modulo) rischieremmo di farlo PRIMA che dotenv abbia
 * popolato `process.env`. Gli altri script del progetto (import-anagrafiche.ts,
 * reset-schede.ts) evitano il problema a monte non importando mai src/lib/mongodb.ts:
 * qui invece dobbiamo riusarlo per non duplicare la logica di ricalcolo, quindi
 * usiamo l'import dinamico che è per costruzione differito a runtime.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const ok   = (msg: string) => console.log('  \x1b[32mOK\x1b[0m  ' + msg)
const log  = (msg: string) => console.log('  --  ' + msg)
const warn = (msg: string) => console.log('  \x1b[33m!!\x1b[0m  ' + msg)

async function main() {
  const mongoose = (await import('mongoose')).default
  const {
    ricalcolaFondiTuttiIPortafogli,
    ricalcolaTotaleRestituitoTuttiIDebiti,
  } = await import('../src/lib/bilancio/ricalcolaFondiPortafoglio')

  console.log('\n--- Ricalcolo fondi portafogli ---')
  const risultatiPortafogli = await ricalcolaFondiTuttiIPortafogli()
  if (risultatiPortafogli.length === 0) {
    log('Nessun portafoglio trovato')
  }
  for (const r of risultatiPortafogli) {
    if (r.avvisi.length > 0 || r.fondiDisponibili === null) {
      warn(`Portafoglio ${r.portafoglioId}: ${r.avvisi.join('; ')}`)
    } else {
      ok(`Portafoglio ${r.portafoglioId}: fondi_disponibili = ${r.fondiDisponibili.toFixed(2)} €`)
    }
  }

  console.log('\n--- Ricalcolo totale_restituito debiti ---')
  const risultatiDebiti = await ricalcolaTotaleRestituitoTuttiIDebiti()
  if (risultatiDebiti.length === 0) {
    log('Nessun debito trovato')
  }
  for (const r of risultatiDebiti) {
    if (r.avvisi.length > 0 || r.totaleRestituito === null) {
      warn(`Debito ${r.debitoId}: ${r.avvisi.join('; ')}`)
    } else {
      ok(`Debito ${r.debitoId}: totale_restituito = ${r.totaleRestituito.toFixed(2)} €`)
    }
  }

  await mongoose.disconnect()
  console.log('\n\x1b[32mRicalcolo completato.\x1b[0m\n')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
