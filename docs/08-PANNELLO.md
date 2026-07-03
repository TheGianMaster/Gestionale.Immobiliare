# ⚙️ DOC-08 — PANNELLO DI CONTROLLO
> **Leggi questo file per:** T-090
> **File chiave:** `src/app/(dashboard)/controllo/`
> **Accesso:** Solo utenti con `ruolo === 'admin'`

---

## 1. STRUTTURA GENERALE

Il pannello di controllo è accessibile da `/controllo` nella sidebar.
Nella fase attuale, ogni sezione mostra un placeholder "Work in Progress" professionale.

**Navigazione interna:** Tab orizzontali o sidebar secondaria con le 6 sezioni.

---

## 2. LAYOUT PAGINA

```
┌────────────────────────────────────────────────────────────┐
│ ⚙️ Pannello di Controllo                                   │
│ Gestisci la configurazione del sistema                     │
├──────────┬─────────────────────────────────────────────────┤
│          │                                                  │
│ [Anagrafi│  🚧 SEZIONE: [NOME]                            │
│  che]    │                                                  │
│ [Varianti│  Questa sezione è in fase di sviluppo.          │
│ [Variabi│  Sarà presto disponibile per configurare         │
│ [Utenze] │  [descrizione funzionalità].                    │
│ [Document│                                                  │
│ [Automaz.│  [Icona illustrativa]                           │
│          │                                                  │
└──────────┴─────────────────────────────────────────────────┘
```

---

## 3. SEZIONI E DESCRIZIONI

### 📋 Anagrafiche
**Funzionalità futura:** Crea, modifica ed elimina tipi di anagrafica. Configura quali campi appaiono nella preview e l'ordine nella sidebar.
**Nota tecnica futura:** CRUD su `AnagraficaConfig` collection.

### 🏷️ Varianti
**Funzionalità futura:** Gestisci le varianti per ogni anagrafica. Definisci quali campi sono oscurati o obbligatori per ogni variante.
**Nota tecnica futura:** CRUD su `Variante` collection.

### 🔧 Variabili
**Funzionalità futura:** Crea e modifica i tipi di campo. Aggiungi nuove variabili alle anagrafiche. Gestisci le opzioni dei campi `select`.
**Nota tecnica futura:** CRUD su `Variabile` e `SelectOption` collection.

### 👥 Utenze
**Funzionalità futura:** Gestisci gli utenti del sistema. Crea/disattiva account. Configura il tempo di sessione per ogni utente o per tutti.
**Nota UI (mostra all'utente):**
```
ℹ️ Il tempo di logout automatico (attualmente 72 ore)
   sarà configurabile da questa sezione per ogni utente
   o a livello globale.
```
**Nota tecnica futura:** CRUD su `User` collection.

### 📎 Documenti
**Funzionalità futura:** Configura i tipi di documento accettati per ogni anagrafica. Gestisci le categorie documentali.
**Nota UI (mostra all'utente):**
```
ℹ️ Da qui potrai configurare quali tipi di documento
   (es: Contratto, Fattura, Documento d'identità) sono
   disponibili per ogni tipo di anagrafica.
```
**Nota tecnica futura:** Modifica `AnagraficaConfig.tipiDocumento[]`.

### ⚡ Automazioni
**Funzionalità futura:** Crea regole automatiche (trigger → azione). Esempi: "quando si crea un cliente → invia email di benvenuto", "quando scade un contratto → crea notifica".
**Nota tecnica futura:** Integrazione con Groq AI per automazioni intelligenti, Resend per email, Twilio per SMS/WhatsApp.

---

## 4. COMPONENTE WIP PLACEHOLDER

```typescript
// src/components/ui/WIPSection.tsx
// Componente riutilizzabile per tutte le sezioni WIP

interface WIPSectionProps {
  nome: string
  descrizione: string
  icona: React.ReactNode
  nota?: string  // nota contestuale (es: per Utenze, per Documenti)
}

// Stile:
// - Card centrata con ombra leggera
// - Icona grande colorata (tone coerente con palette)
// - Badge "🚧 Work in Progress" in arancione
// - Titolo sezione
// - Descrizione funzionalità futura
// - Nota contestuale (se presente) in box azzurro info
// NON usare un semplice testo grigio — rendilo professionale
```

---

## 5. PROTEZIONE ROUTE ADMIN

```typescript
// In src/app/(dashboard)/controllo/page.tsx:
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function PannelloPage() {
  const session = await auth()

  if (!session || session.user.ruolo !== 'admin') {
    redirect('/')
  }

  // Render pannello...
}
```

**NOTA:** Il middleware in `src/middleware.ts` fa già il redirect per le route `/controllo/*`. Questo check nel componente è una doppia sicurezza (defense in depth).

---

## 5. SEZIONE AUTOMAZIONI (IMPLEMENTATA)

La sezione Automazioni NON è più WIP. Ha un layout reale con card per ogni wizard disponibile.

### Componente
`SezioneAutomazioni` in `src/app/(dashboard)/controllo/page.tsx`

### UI
```tsx
// Card per ogni automazione:
<div className="flex items-center gap-4 px-4 py-4 rounded-xl border">
  <div className="w-10 h-10 rounded-xl ..."><Zap /></div>
  <div className="flex-1">
    <p>Nuovo debito</p>
    <p>Crea Debito + Portafogli + Ricavo...</p>
  </div>
  <button onClick={() => setShowWizard(true)}>Avvia</button>
</div>
{showWizard && <NuovoDebitoWizard onClose={() => setShowWizard(false)} />}
```

### Wizard disponibili
| Nome | Componente | API |
|------|------------|-----|
| Nuovo Debito | `NuovoDebitoWizard` | `POST /api/automazioni/nuovo-debito` |

Per documentazione completa del wizard → `docs/11-AUTOMAZIONI.md`

---

## 6. MAPPA TAB PANNELLO CONTROLLO

| Tab | Componente | Stato |
|-----|-----------|-------|
| Anagrafiche | SezioneAnagrafiche | ✅ Attivo (import/export Excel) |
| Varianti | WIPSection | 🚧 WIP |
| Variabili | WIPSection | 🚧 WIP |
| Utenze | WIPSection | 🚧 WIP |
| Documenti | WIPSection | 🚧 WIP |
| Automazioni | SezioneAutomazioni | ✅ Attivo (wizard Nuovo Debito) |

