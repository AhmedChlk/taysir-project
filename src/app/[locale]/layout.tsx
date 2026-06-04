import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import SessionProviderWrapper from "@/components/providers/SessionProviderWrapper";
import "./globals.css";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

// Variable display font for massive animated data numbers (wght axis animated via GSAP).
const fraunces = Fraunces({
	variable: "--font-display",
	subsets: ["latin"],
	axes: ["opsz", "SOFT", "WONK"],
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

	const dir = locale === "ar" ? "rtl" : "ltr";

	return (
		<html
			lang={locale}
			dir={dir}
			className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col font-sans">
				<NextIntlClientProvider locale={locale} messages={messages}>
					<SessionProviderWrapper>{children}</SessionProviderWrapper>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
