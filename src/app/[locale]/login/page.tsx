"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LanguageSwitcher from "@/components/navigation/LanguageSwitcher";
import { Input } from "@/components/ui/FormInput";
import { useRouter } from "@/i18n/routing";
import Link from "next/link";

// --- Design System Primitives ---

const LogoMark = ({ size = 28, color = "var(--brand-500)" }: { size?: number; color?: string }) => (
	<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
		<g fill={color}>
			<rect x="26" y="6" width="12" height="52" rx="3" />
			<rect x="6" y="26" width="52" height="12" rx="3" />
			<rect x="26" y="26" width="12" height="12" fill="#fff" />
			<rect x="28" y="28" width="8" height="8" fill={color} />
		</g>
	</svg>
);

const Logo = () => (
	<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
		<LogoMark size={32} color="var(--brand-500)" />
		<span
			style={{
				fontSize: 26,
				fontWeight: 700,
				letterSpacing: "-0.02em",
				color: "var(--fg1)",
				fontFamily: "var(--font-sans)",
			}}
		>
			taysir
		</span>
	</div>
);

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const t = useTranslations();
	const locale = useLocale();
	const isRtl = locale === "ar";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const result = await signIn("credentials", {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				setError(t("error_invalid_credentials"));
			} else {
				router.push("/dashboard");
			}
		} catch {
			setError(t("error_generic"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			className="min-h-screen w-full bg-white font-sans antialiased flex flex-col"
			dir={isRtl ? "rtl" : "ltr"}
		>
			{/* Simple Header */}
			<header className="w-full max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
				<Link href={`/${locale}`} className="transition-opacity hover:opacity-80">
					<Logo />
				</Link>
				<LanguageSwitcher />
			</header>

			{/* Centered Content */}
			<main className="flex-1 flex items-center justify-center p-6 pb-24">
				<div className="w-full max-w-[400px] space-y-10">
					<div className="space-y-3 text-center">
						<motion.h1 
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-4xl font-bold text-ink-900 tracking-tight"
						>
							{t("login_welcome_back")}
						</motion.h1>
						<motion.p 
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}
							className="text-ink-500 text-lg"
						>
							{t("login_subtitle")}
						</motion.p>
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
					>
						<form className="space-y-6" onSubmit={handleSubmit}>
							<AnimatePresence mode="wait">
								{error && (
									<motion.div 
										initial={{ opacity: 0, scale: 0.98 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.98 }}
										className="rounded-xl bg-rose-50 p-4 text-sm text-danger border border-rose-100 font-semibold"
									>
										{error}
									</motion.div>
								)}
							</AnimatePresence>

							<div className="space-y-4">
								<Input
									label={t("email")}
									type="email"
									id="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder={t("placeholder_email")}
									autoComplete="email"
								/>

								<div className="space-y-1">
									<Input
										label={t("password")}
										type="password"
										id="password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="••••••••"
										autoComplete="current-password"
									/>
									<div className="flex justify-end">
										<button
											type="button"
											className="text-xs text-brand-500 hover:text-brand-700 font-bold transition-colors"
										>
											{t("forgot_password")}
										</button>
									</div>
								</div>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="btn btn--primary btn--lg w-full h-[52px] shadow-sm"
							>
								{loading ? <Loader2 className="animate-spin" size={22} /> : t("login_button")}
							</button>
						</form>
					</motion.div>

					<motion.div 
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.4 }}
						className="pt-8 text-center border-t border-gray-100 space-y-4"
					>
						<p className="text-sm text-ink-500">
							{t("no_account_yet")}{" "}
							<button className="text-brand-500 font-bold hover:underline">
								{t("contact_sales")}
							</button>
						</p>
						<Link 
							href={`/${locale}`}
							className="block text-xs text-ink-400 hover:text-ink-900 transition-colors font-medium"
						>
							← Retour à la page d'accueil
						</Link>
					</motion.div>
				</div>
			</main>

			{/* Simple Footer */}
			<footer className="py-8 text-center text-ink-400 text-xs font-medium">
				<div className="flex justify-center gap-6 mb-4 opacity-50 uppercase tracking-widest">
					<span>Paris</span>
					<span>Alger</span>
					<span>Tunis</span>
				</div>
				<p>© 2026 Taysir. {t("all_rights_reserved")}</p>
			</footer>
		</div>
	);
}
