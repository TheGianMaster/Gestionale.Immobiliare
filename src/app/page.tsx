// Redirect alla dashboard se autenticato, altrimenti al login
// La logica di redirect è gestita dal middleware (T-011)
import { redirect } from 'next/navigation'

export default function Home() {
  // Il middleware NextAuth gestisce il redirect
  // Questa pagina non dovrebbe mai essere raggiunta direttamente
  redirect('/login')
}
