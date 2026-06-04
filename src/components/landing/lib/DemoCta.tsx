"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { CONTACT, whatsappUrl } from "./contact";

/* ------------------------------------------------------------------ */
/* Context: open the demo-lead modal from anywhere on the landing      */
/* ------------------------------------------------------------------ */

type DemoModalCtx = { open: () => void; close: () => void; isOpen: boolean };
const Ctx = createContext<DemoModalCtx | null>(null);

export function useDemoModal(): DemoModalCtx {
	const ctx = useContext(Ctx);
	if (!ctx)
		throw new Error("useDemoModal must be used inside <DemoCtaProvider>");
	return ctx;
}

export function DemoCtaProvider({ children }: { children: ReactNode }) {
	const [isOpen, setOpen] = useState(false);
	return (
		<Ctx.Provider
			value={{ isOpen, open: () => setOpen(true), close: () => setOpen(false) }}
		>
			{children}
			<DemoModal />
			<WhatsAppFloat />
		</Ctx.Provider>
	);
}

/* ------------------------------------------------------------------ */
/* Primary CTA button — opens the modal                                */
/* ------------------------------------------------------------------ */

export function DemoButton({
	children,
	className = "btn btn--primary btn--lg",
}: {
	children: ReactNode;
	className?: string;
}) {
	const { open } = useDemoModal();
	return (
		<button type="button" className={className} onClick={open}>
			{children}
		</button>
	);
}

/* ------------------------------------------------------------------ */
/* The lead modal — collects school + phone, hands off to WhatsApp     */
/* ------------------------------------------------------------------ */

function DemoModal() {
	const { isOpen, close } = useDemoModal();
	const [school, setSchool] = useState("");
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
		document.addEventListener("keydown", onKey);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = "";
		};
	}, [isOpen, close]);

	if (!isOpen) return null;

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		const msg =
			`Bonjour Taysir, je souhaite une démo.\n` +
			`École : ${school || "—"}\n` +
			`Contact : ${name || "—"}\n` +
			`Téléphone : ${phone || "—"}`;
		window.open(whatsappUrl(msg), "_blank", "noopener,noreferrer");
		close();
	};

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Réserver une démo"
			onMouseDown={(e) => e.target === e.currentTarget && close()}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: 20,
				background: "rgba(8,30,34,0.55)",
				backdropFilter: "blur(4px)",
				animation: "taysir-fade 0.2s ease",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 440,
					background: "#fff",
					borderRadius: 20,
					padding: 32,
					boxShadow: "0 30px 80px rgba(8,30,34,0.35)",
					animation: "taysir-pop 0.28s cubic-bezier(0.22,1,0.36,1)",
				}}
			>
				<h3
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "var(--fg1)",
						margin: 0,
						letterSpacing: "-0.02em",
					}}
				>
					Réservez votre démo
				</h3>
				<p style={{ fontSize: 15, color: "var(--fg2)", margin: "8px 0 24px" }}>
					Un conseiller vous rappelle sous 24h. Aucune carte requise.
				</p>
				<form
					onSubmit={submit}
					style={{ display: "flex", flexDirection: "column", gap: 14 }}
				>
					<Field
						label="Nom de l'établissement"
						value={school}
						onChange={setSchool}
						placeholder="École El Nour"
						required
					/>
					<Field
						label="Votre nom"
						value={name}
						onChange={setName}
						placeholder="Directeur / Gérant"
						required
					/>
					<Field
						label="Téléphone / WhatsApp"
						value={phone}
						onChange={setPhone}
						placeholder="0X XX XX XX XX"
						type="tel"
						required
					/>
					<button
						type="submit"
						className="btn btn--primary btn--lg"
						style={{ marginTop: 6, justifyContent: "center" }}
					>
						Continuer sur WhatsApp
					</button>
					<button
						type="button"
						onClick={close}
						style={{
							background: "none",
							border: "none",
							color: "var(--fg3)",
							fontSize: 13,
							cursor: "pointer",
							padding: 4,
						}}
					>
						Annuler
					</button>
				</form>
			</div>
		</div>
	);
}

function Field({
	label,
	value,
	onChange,
	placeholder,
	type = "text",
	required,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	type?: string;
	required?: boolean;
}) {
	return (
		<label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
			<span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg2)" }}>
				{label}
			</span>
			<input
				type={type}
				value={value}
				required={required}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
				style={{
					height: 44,
					borderRadius: 10,
					border: "1px solid #D8DEE2",
					padding: "0 14px",
					fontSize: 15,
					color: "var(--fg1)",
					outline: "none",
				}}
			/>
		</label>
	);
}

/* ------------------------------------------------------------------ */
/* Persistent floating WhatsApp button                                 */
/* ------------------------------------------------------------------ */

function WhatsAppFloat() {
	return (
		<a
			href={whatsappUrl(
				"Bonjour Taysir, je souhaite des informations sur la plateforme.",
			)}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={`Discuter sur WhatsApp ${CONTACT.phoneDisplay}`}
			style={{
				position: "fixed",
				right: 22,
				bottom: 22,
				zIndex: 900,
				width: 58,
				height: 58,
				borderRadius: 999,
				background: "#25D366",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				boxShadow: "0 12px 30px rgba(37,211,102,0.45)",
			}}
		>
			<svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden>
				<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.5 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
			</svg>
			<span
				style={{
					position: "absolute",
					width: 1,
					height: 1,
					overflow: "hidden",
					clip: "rect(0 0 0 0)",
				}}
			>
				Discuter sur WhatsApp
			</span>
		</a>
	);
}
