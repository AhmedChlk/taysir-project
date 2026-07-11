"use client";

import { clsx } from "clsx";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { type routing, usePathname, useRouter } from "@/i18n/routing";
import { usePopoverDismiss } from "@/lib/hooks/usePopoverDismiss";

const PANEL_ID = "lang-menu-panel";

export default function LanguageSwitcher() {
	const locale = useLocale();
	const t = useTranslations();
	const pathname = usePathname();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const close = useCallback(() => setIsOpen(false), []);
	usePopoverDismiss(isOpen, close);

	const locales = [
		{ code: "fr", label: "Français", flag: "🇫🇷" },
		{ code: "ar", label: "العربية", flag: "🇩🇿" },
	];

	const handleLocaleChange = (newLocale: string) => {
		router.replace(pathname, {
			locale: newLocale as (typeof routing.locales)[number],
		});
		setIsOpen(false);
	};

	const currentLocale = locales.find((l) => l.code === locale);

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-controls={PANEL_ID}
				className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all duration-200 border border-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
			>
				<Languages size={18} className="text-brand-500" />
				<span className="text-sm font-bold hidden sm:inline">
					{currentLocale?.label}
				</span>
				<ChevronDown
					size={14}
					className={clsx(
						"transition-transform duration-200",
						isOpen && "rotate-180",
					)}
				/>
			</button>

			{isOpen && (
				<>
					<button
						type="button"
						tabIndex={-1}
						aria-hidden
						className="fixed inset-0 z-40 cursor-default bg-transparent w-full h-full"
						onClick={() => setIsOpen(false)}
					/>
					<div
						id={PANEL_ID}
						role="menu"
						aria-label={t("language_menu")}
						className={clsx(
							"ts-pop absolute top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50",
							locale === "ar" ? "left-0" : "right-0",
						)}
					>
						{locales.map((l) => (
							<button
								key={l.code}
								type="button"
								role="menuitem"
								onClick={() => handleLocaleChange(l.code)}
								className={clsx(
									"flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:bg-brand-500/5",
									locale === l.code
										? "bg-brand-500/5 text-brand-500"
										: "text-gray-600 hover:bg-gray-50",
								)}
							>
								<div className="flex items-center gap-3">
									<span className="text-lg">{l.flag}</span>
									<span>{l.label}</span>
								</div>
								{locale === l.code && <Check size={16} />}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}
