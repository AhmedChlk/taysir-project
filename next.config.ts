import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Désactivation temporaire du mode standalone et des headers complexes pour stabiliser Turbopack en dev
};

export default withNextIntl(nextConfig);
