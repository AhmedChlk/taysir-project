"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
	const t = useTranslations();

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 p-6 text-center font-sans antialiased">
			<div className="relative mb-8">
                <div className="text-[120px] font-bold text-brand-900/5 leading-none select-none">404</div>
                <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-bold text-brand-500 tracking-tighter">404</h1>
            </div>
			<h2 className="mb-8 text-2xl font-bold text-ink-900 tracking-tight">
				{t("no_results")}
			</h2>
			<Link
				href="/"
				className="btn btn--primary btn--lg px-10 shadow-xl shadow-brand-500/10 active:scale-95"
			>
				Retour à l'accueil
			</Link>
            
            <div className="mt-16 opacity-20 grayscale">
                <div className="flex items-center gap-3">
                    <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                        <rect x="26" y="6" width="12" height="52" rx="3" fill="var(--brand-900)" />
                        <rect x="6" y="26" width="52" height="12" rx="3" fill="var(--brand-900)" />
                    </svg>
                    <span className="text-xl font-bold tracking-tight text-ink-900">taysir</span>
                </div>
            </div>
		</div>
	);
}
