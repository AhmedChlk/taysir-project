"use client";

import { clsx } from "clsx";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { type routing, usePathname, useRouter } from "@/i18n/routing";

export default function LanguageSwitcher() {
	const locale = useLocale();
	const pathname = usePathname();
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);

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
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-all duration-200 border border-gray-100"
			>
				<Languages size={18} className="text-primary-teal" />
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
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsOpen(false)}
					/>
					<div
						className={clsx(
							"absolute top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200",
							locale === "ar" ? "left-0" : "right-0",
						)}
					>
						{locales.map((l) => (
							<button
								key={l.code}
								onClick={() => handleLocaleChange(l.code)}
								className={clsx(
									"flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors",
									locale === l.code
										? "bg-primary-teal/5 text-primary-teal"
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
