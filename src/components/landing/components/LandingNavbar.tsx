"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./LandingLogo";

export const LandingNavbar = ({ locale }: { locale: string }) => {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 12);
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
		<nav
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				zIndex: 50,
				height: "var(--nav-h)",
				display: "flex",
				alignItems: "center",
				background: scrolled ? "rgba(255,255,255,0.92)" : "#fff",
				backdropFilter: scrolled ? "blur(10px)" : "none",
				WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
				borderBottom: scrolled ? "1px solid var(--border-subtle)" : "none",
				padding: "0 5%",
			}}
		>
			<Link href={`/${locale}` as any} style={{ textDecoration: "none" }}>
				<Logo />
			</Link>

			<div
				style={{
					marginLeft: "auto",
					display: "flex",
					gap: 32,
					alignItems: "center",
				}}
			>
				{links.map((l) => (
					<Link
						key={l.label}
						href={l.href as any}
						style={{
							fontSize: 14,
							fontWeight: 500,
							color: "var(--fg2)",
							textDecoration: "none",
							transition: "color 0.2s",
						}}
					>
						{l.label}
					</Link>
				))}
				<Link
					href={loginUrl as any}
					style={{
						background: "var(--brand-500)",
						color: "#fff",
						padding: "8px 20px",
						borderRadius: 8,
						fontSize: 14,
						fontWeight: 600,
						textDecoration: "none",
						transition: "transform 0.2s, background 0.2s",
					}}
				>
					Connexion
				</Link>
			</div>
		</nav>
	);
};
