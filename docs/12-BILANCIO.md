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

