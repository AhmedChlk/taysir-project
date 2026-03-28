import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * ROOT PAGE
 * Next.js 15 avec next-intl requiert une racine propre 
 * pour forcer la redirection vers la locale par défaut
 * si le middleware n'a pas intercepté (ou en cas de static build)
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
