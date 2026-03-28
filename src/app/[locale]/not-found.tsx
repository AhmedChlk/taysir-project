import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Home } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-primary-teal">404</h1>
      <h2 className="mb-8 text-2xl font-semibold text-gray-700">
        {t('no_results')}
      </h2>
      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl bg-primary-teal px-6 py-3 font-bold text-white shadow-lg shadow-primary-teal/20 hover:bg-accent-teal hover:-translate-y-0.5 transition-all"
      >
        <Home size={20} />
        {t('dashboard')}
      </Link>
    </div>
  );
}
