import type { Metadata } from "next";
import { Big_Shoulders, Petrona, Reem_Kufi, Vazirmatn } from "next/font/google";
import { getServerSession } from "next-auth/next";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import { authOptions } from "@/lib/auth";
import "./globals.css";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

// Taysir type system (workflow: typography-expert "Condensed Power").
// DISPLAY — Big Shoulders Display: condensed industrial caps for headlines.
const bigShoulders = Big_Shoulders({
	variable: "--font-display",
	subsets: ["latin"],
	display: "swap",
});

// BODY / UI — Petrona: warm slab-transitional serif (trustworthy, editorial).
const petrona = Petrona({
	variable: "--font-body",
	subsets: ["latin"],
	display: "swap",
});

// NUMERIC + ARABIC workhorse — Vazirmatn: one variable file drives DA / % /
// tabular figures AND Arabic UI (identical glyphs FR/AR) + the GSAP wght
// stat animation in PowerShowcase.
const vazirmatn = Vazirmatn({
	variable: "--font-numeric",
	subsets: ["arabic", "latin"],
	display: "swap",
});

// ARABIC display — Reem Kufi: squared Kufic that rhymes with zellige geometry.
const reemKufi = Reem_Kufi({
	variable: "--font-arabic-display",
	subsets: ["arabic"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Taysir - Gestion Scolaire",
	description: "SaaS de gestion scolaire multi-tenant pour l'Algérie",
};

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// Ensure that the incoming `locale` is valid
	if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
		notFound();
	}

	// Enable static rendering
	setRequestLocale(locale);

	// Providing all messages to the client
	// side is the easiest way to get started
	const messages = await getMessages();

	// Session résolue côté serveur → hydrate next-auth (pas de flash "loading").
	const session = await getServerSession(authOptions);

	const dir = locale === "ar" ? "rtl" : "ltr";

	return (
		<html
			lang={locale}
			dir={dir}
			className={`${bigShoulders.variable} ${petrona.variable} ${vazirmatn.variable} ${reemKufi.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col font-body">
				<NextIntlClientProvider locale={locale} messages={messages}>
					<SessionProviderWrapper session={session}>
						{children}
					</SessionProviderWrapper>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
