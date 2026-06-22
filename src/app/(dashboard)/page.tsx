/**
 * src/app/(dashboard)/page.tsx
 * Reindirizza a /home per risolvere il conflitto di route con src/app/page.tsx.
 * La dashboard vera è in (dashboard)/home/page.tsx.
 */
import { redirect } from 'next/navigation'

export default function DashboardRootPage() {
  redirect('/home')
}
