# ⚡ DOC-11 — AUTOMAZIONI
> **Leggi questo file per:** T-102 e futuri wizard
> **File chiave:** `src/app/(dashboard)/controllo/page.tsx`, `src/app/api/automazioni/`, `src/components/automazioni/`
> **Accesso UI:** Pannello Controllo > tab Automazioni (solo admin)

---

## 1. CONCETTO

Le automazioni sono wizard guidati che creano più record in più anagrafiche in un singolo flusso atomico.
Ogni wizard ha rollback: se un passaggio fallisce, i record precedenti vengono eliminati.

---

## 2. WIZARD: NUOVO DEBITO

### Percorso file
```
src/app/api/automazioni/nuovo-debito/route.ts   ← POST endpoint
src/components/automazioni/NuovoDebitoWizard.tsx ← UI wizard
```

### Cosa crea
```
1. Scheda Debiti        → collezione schede_debiti
2. Scheda Portafogli    → collezione schede_portafogli (collega al debito)
3. Scheda Ricavi        → collezione schede_ricavi (collega al portafogli)
```

### Step del wizard

| Step | Condizione | Contenuto |
|------|-----------|-----------|
| 1 | sempre | Tipo debito: `infruttifero` o `bancario` (+ sottotipo mutuo/finanziamento) |
| 2 | solo bancario | Tipo tasso: `alla francese` o `altro` |
| 3 | solo bancario | Tasso interesse + totale addebitato + durata anni |
| 4 | solo bancario | Rata mensile + data prima rata + giorno promemoria |
| 5 | sempre | Titolo, importo erogato, scadenza prevista, referente, casa, note |
| 6 | sempre | Recap + conferma |

Infruttifero salta gli step 2-4 → naviga direttamente 1 → 5 → 6.

### Navigazione step (logica `getActiveSteps`)
```typescript
// bancario:     [1,2,3,4,5,6]
// infruttifero: [1,5,6]
// goNext()/goPrev() usano active.indexOf(step) per saltare automaticamente
```

### Payload POST `/api/automazioni/nuovo-debito`
```typescript
{
  tipoDebito: 'infruttifero' | 'bancario'
  tipoBancario?: 'mutuo' | 'finanziamento'           // solo bancario
  tipoTasso?: 'alla_francese' | 'altro'              // solo bancario
  tassoInteresse?: number                            // solo bancario
  totaleAddebitato?: number                          // solo bancario
  durataAnni?: number                                // solo bancario
  rataMensile?: number                               // solo bancario
  dataPrimaRata?: string                             // solo bancario, YYYY-MM-DD
  giornoPromemoria?: number                          // solo bancario, 1-31
  titolo: string                                     // obbligatorio
  importoErogato: number                             // obbligatorio, > 0
  scadenzaPrevista?: string                          // YYYY-MM-DD
  referente?: { id: string; label: string }          // reference → rubrica
  casaRiferimento?: { id: string; label: string }    // reference → case
  note?: string
}
```

### Response successo
```typescript
{
  success: true,
  message: string,
  ids: {
    debito:     string  // ObjectId scheda debito
    portafogli: string  // ObjectId scheda portafogli
    ricavo:     string  // ObjectId scheda ricavo
  }
}
```

### Response errore
```typescript
{
  error: string,
  codice: 'ERR_AUTH' | 'ERR_VALIDATION' | 'ERR_ANA_DEBITI' |
          'ERR_ANA_PORTAFOGLI' | 'ERR_ANA_RICAVI' |
          'ERR_CREATE_DEBITO' | 'ERR_CREATE_PORTAFOGLI' |
          'ERR_CREATE_RICAVO' | 'ERR_INTERNO',
  dettaglio?: string  // presente per ERR_CREATE_* e ERR_INTERNO
  nota?: string       // IDs eliminati in rollback
}
```

### Dati scritti nel Debito
```typescript
dati: {
  titolo:             titoloDebito,
  tipo_debito:        'infruttifero' | 'mutuo' | 'finanziamento',
  importo_erogato:    number,
  data_apertura:      'YYYY-MM-DD',  // oggi
  // opzionali:
  referente:          { id, label },
  casa_riferimento:   { id, label },
  note:               string,
  scadenza_prevista:  'YYYY-MM-DD',
  // solo bancario:
  tipo_tasso:         'alla francese' | 'altro',
  tasso_interesse:    number,
  totale_addebitato:  number,
  rata_mensile:       number,
  durata_anni:        number,
  data_prima_rata:    'YYYY-MM-DD',
  giorno_promemoria:  number,
}
```

### Dati scritti nel Portafogli
```typescript
dati: {
  titolo:            `Portafogli di debito - ${titoloDebito}`,
  debito_associato:  { id: debito._id, label: titoloDebito },
  data_apertura:     'YYYY-MM-DD',  // oggi
}
```

### Dati scritti nel Ricavo
```typescript
dati: {
  titolo:             `apertura debito ${titoloDebito}`,
  importo_totale:     number,
  fondi_destinazione: [{ fondo: { id: portafogli._id, label: titoloPortafogli }, importo: number }],
  stato_ricavo:       'incassata',
  tipo_ricavo:        'debito',
  descrizione:        `incasso dell'importo erogato dal debito: ${titoloDebito}`,
  data:               'YYYY-MM-DD',  // oggi
  casa:               { id, label } | undefined,  // da casaRiferimento wizard
}
```

### Rollback logica
```
Debito creato → Portafogli fallisce → deleteMany({_id: debito._id}) → return ERR_CREATE_PORTAFOGLI
Portafogli creato → Ricavo fallisce → deleteMany entrambi → return ERR_CREATE_RICAVO
```

---

## 3. COMPONENTE REFSEARCH (interno al wizard)

`RefSearch` in `NuovoDebitoWizard.tsx` è un inline reference picker:
- Input con debounce 250ms → `GET /api/anagrafiche/${slug}/schede?limit=8&q=...`
- Dropdown risultati: usa `d.data` (non `d.schede` — attenzione: API lista usa `data` non `schede`)
- Pulsante `+` → `window.open('/anagrafica/${slug}/new', '_blank')`
- Valore: `{ id: string; label: string }`

---

## 4. AGGIUNGERE UN NUOVO WIZARD

1. Creare `src/app/api/automazioni/{nome-wizard}/route.ts` (POST con logica atomica)
2. Creare `src/components/automazioni/{NomeWizard}Wizard.tsx`
3. In `src/app/(dashboard)/controllo/page.tsx`:
   - Importare il wizard
   - Aggiungere una card in `SezioneAutomazioni` con pulsante "Avvia"
   - Il pulsante imposta `showWizard` nello state locale

