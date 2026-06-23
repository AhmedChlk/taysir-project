"use client";

import { motion } from "framer-motion";
import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DemoButton } from "../lib/DemoCta";
import { Logo } from "./LandingLogo";

export const LandingNavbar = ({ locale }: { locale: string }) => {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const loginUrl = `/${locale}/login`;
	const links = [
		{ label: "Produit", href: "#produit" },
		{ label: "Solutions", href: "#solutions" },
		{ label: "Tarifs", href: "#tarifs" },
	];

	return (
		<motion.nav
			className={`lnav${scrolled ? " lnav--scrolled" : ""}`}
			initial={{ y: -16, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
		>
			<Link
				href={`/${locale}` as Route}
				className="lnav-logo"
				aria-label="Taysir — accueil"
			>
				<Logo />
			</Link>

			<div className="lnav-right">
				<div className="lnav-links">
					{links.map((l) => (
						<Link key={l.label} href={l.href as Route} className="lnav-link">
							{l.label}
						</Link>
					))}
				</div>
				<span className="lnav-divider" aria-hidden />
				<Link href={loginUrl as Route} className="lnav-login">
					Connexion
				</Link>
				<DemoButton className="lnav-cta">
					Réserver une démo
					<span className="lnav-cta-arrow" aria-hidden>
						→
					</span>
				</DemoButton>
			</div>
		</motion.nav>
	);
};
