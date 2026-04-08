import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Le matcher doit capturer toutes les routes sauf l'API et les assets statiques
  matcher: [
    // Redirection de la racine vers la locale par défaut
    '/',
    
    // Support des locales (/fr, /ar)
    '/(fr|ar)/:path*',
    
    // Catch-all pour injecter la locale par défaut sur les routes orphelines
    // en excluant les fichiers système, l'API et les assets
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
