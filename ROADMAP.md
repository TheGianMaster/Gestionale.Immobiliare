# 🗺️ ROADMAP — GESTIONALE
> Timeline di sviluppo per fasi. Ogni fase dipende dalle precedenti.
> Aggiorna questo file al completamento di ogni fase.

---

## FASE 0 — SETUP & FONDAMENTA
**Stima:** 1-2 sessioni
**Ticket:** T-001, T-002, T-003, T-004

Obiettivo: progetto funzionante, DB connesso, palette definita, struttura cartelle creata.
✅ Output atteso: `npm run dev` senza errori, `.env.example` completo, palette importabile.

---

## FASE 1 — AUTENTICAZIONE
**Stima:** 1-2 sessioni
**Ticket:** T-010, T-011, T-012, T-013
**Dipende da:** Fase 0

Obiettivo: login funzionante con sessione 72h, crittografia password, middleware route protection.
✅ Output atteso: login/logout funzionanti, route dashboard protette, seed admin eseguito.

---

## FASE 2 — DATABASE SCHEMA
**Stima:** 1 sessione
**Ticket:** T-020, T-021, T-022, T-023, T-024, T-025, T-026, T-027
**Dipende da:** Fase 0

Obiettivo: tutti i modelli Mongoose creati con indici corretti.
✅ Output atteso: tutti i modelli importabili senza errori TypeScript.

---

## FASE 3 — LAYOUT & NAVIGAZIONE
**Stima:** 1-2 sessioni
**Ticket:** T-030, T-031, T-032
**Dipende da:** Fase 1, Fase 2

Obiettivo: dashboard navigabile, sidebar con anagrafiche dinamiche, header completo.
✅ Output atteso: layout responsive desktop/mobile, notifiche funzionanti.

---

## FASE 4 — MOTORE ANAGRAFICA
**Stima:** 2-3 sessioni
**Ticket:** T-040, T-041, T-042, T-043, T-044
**Dipende da:** Fase 2, Fase 3

Obiettivo: CRUD completo schede, preview con search, view e edit funzionanti.
✅ Output atteso: anagrafica "Clienti" (da seed) pienamente operativa.

---

## FASE 5 — FIELD TYPES SYSTEM
**Stima:** 2-3 sessioni
**Ticket:** T-050, T-051, T-052, T-053, T-054, T-055, T-056
**Dipende da:** Fase 2, Fase 4

Obiettivo: tutti i 10 tipi di campo implementati e funzionanti nel form.
✅ Output atteso: FieldRenderer che copre tutti i casi, validazioni client+server.

---

## FASE 6 — DOCUMENTI
**Stima:** 1-2 sessioni
**Ticket:** T-060, T-061
**Dipende da:** Fase 4, Fase 5

Obiettivo: upload file su R2, gestione tipi, preview in-browser.
✅ Output atteso: caricare JPEG/PDF/HTML su una scheda, visualizzarli, eliminarli.

---

## FASE 7 — CALENDARIO
**Stima:** 2 sessioni
**Ticket:** T-070, T-071, T-072
**Dipende da:** Fase 3

Obiettivo: calendario mensile e giornaliero con gestione eventi ed etichette.
✅ Output atteso: creare/modificare/eliminare eventi, navigare per mese/giorno.

---

## FASE 8 — NOTIFICHE
**Stima:** 1 sessione
**Ticket:** T-080, T-081
**Dipende da:** Fase 3

Obiettivo: sistema notifiche in-app completo con badge e dropdown.
✅ Output atteso: campanellina con counter, lista notifiche, segna come letta.

---

## FASE 9 — PANNELLO CONTROLLO (WIP)
**Stima:** 0.5 sessioni
**Ticket:** T-090
**Dipende da:** Fase 3

Obiettivo: shell del pannello controllo con sezioni WIP placeholder.
✅ Output atteso: struttura navigabile, accessibile solo admin.

---

## FASE 10 — SKILLS SYSTEM
**Stima:** 0.5 sessioni
**Ticket:** T-100
**Dipende da:** tutte le fasi precedenti

Obiettivo: documenti skill per ottimizzare futuri sviluppi con agente AI.
✅ Output atteso: 5 skill file completi e testati.

---

## FASE 11 — UI SYSTEM & PALETTE
**Stima:** 1-2 sessioni
**Ticket:** T-110, T-111
**Dipende da:** Fase 0

NOTA: questa fase può iniziare in parallelo alla Fase 2.
Obiettivo: design system completo, componenti UI base, tema chiaro/scuro.
✅ Output atteso: tutti i componenti base utilizzabili ovunque.

---

## FASE 12 — SEED & CONFIG INIZIALE
**Stima:** 0.5 sessioni
**Ticket:** T-120
**Dipende da:** Fase 2, Fase 5

Obiettivo: database popolato con dati dimostrativi.
✅ Output atteso: `npm run seed:data` funzionante, anagrafica Clienti con 3 schede.

---

## FASE 13 — QUALITÀ & SICUREZZA
**Stima:** 1 sessione
**Ticket:** T-130, T-131
**Dipende da:** tutte le fasi precedenti

Obiettivo: middleware sicurezza, validatori centralizzati.
✅ Output atteso: penetration checklist superata, nessun warning TypeScript.

---

## FASE 14 — DEPLOY
**Stima:** 0.5 sessioni
**Ticket:** T-140
**Dipende da:** tutte le fasi precedenti

Obiettivo: documentazione deploy completa.
✅ Output atteso: guida step-by-step deploy su Vercel + MongoDB Atlas.

---

## ORDINE CONSIGLIATO DI ESECUZIONE

```
Fase 0 → Fase 1 → Fase 2 → Fase 11 (parallel)
                           ↓
                        Fase 3
                           ↓
                        Fase 4
                           ↓
                        Fase 5
                        ↓     ↓
                    Fase 6  Fase 7
                        ↓     ↓
                        Fase 8
                           ↓
                     Fase 9 → Fase 10 → Fase 12 → Fase 13 → Fase 14
```
