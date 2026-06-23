"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/* ==========================================================================
   HeroWhatsAppThread — "Le fil WhatsApp".
   The hero media tells Taysir's one true story: a tuition reminder goes out on
   WhatsApp, the parent pays, the receipt is sent back automatically, and the
   school's recouvrement climbs. A living conversation on a floating phone, set
   on the brand-teal canvas, with a recouvrement card that ticks up the moment
   the payment lands. Plays once on load; rests. Reduced motion → resolved state.
   ========================================================================== */

const WA_HEADER = "#075e54"; // WhatsApp header teal
const WA_BG = "#ece5dd"; // WhatsApp chat wallpaper
const WA_OUT = "#d9fdd3"; // outgoing bubble (light green)
const WA_TICK = "#34b7f1"; // read-receipt blue
const WA_SEND = "#25d366"; // WhatsApp green

const STEP = {
	RAPPEL: 1,
	TYPING: 2,
	REGLE: 3,
	PAID: 4,
	RECU: 5,
	DONE: 6,
} as const;

function Ticks({ read }: { read: boolean }) {
	return (
		<svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden>
			<title>{read ? "Lu" : "Envoyé"}</title>
			<path
				d="M11.07.65 4.66 7.5 2.4 5.27 1.3 6.4l3.36 3.3L12.2 1.8zM15 .65 8.6 7.5l-.9-.9-1.1 1.13.9.9 1.1 1.1z"
				fill={read ? WA_TICK : "#8aa3a0"}
			/>
		</svg>
	);
}

function TypingDots() {
	return (
		<span style={{ display: "inline-flex", gap: 4, padding: "2px 2px" }}>
			{[0, 1, 2].map((i) => (
				<motion.span
					key={i}
					style={{
						width: 7,
						height: 7,
						borderRadius: 999,
						background: "#9aa6a3",
						display: "inline-block",
					}}
					animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
					transition={{
						duration: 1,
						repeat: Number.POSITIVE_INFINITY,
						delay: i * 0.18,
						ease: "easeInOut",
					}}
				/>
			))}
		</span>
	);
}

const bubble = (delay = 0) => ({
	initial: { opacity: 0, y: 10, scale: 0.96 },
	animate: { opacity: 1, y: 0, scale: 1 },
	transition: { duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export function HeroWhatsAppThread() {
	const reduce = useReducedMotion();
	const [step, setStep] = useState<number>(reduce ? STEP.DONE : 0);

	useEffect(() => {
		if (reduce) return;
		const t = [
			setTimeout(() => setStep(STEP.RAPPEL), 500),
			setTimeout(() => setStep(STEP.TYPING), 1700),
			setTimeout(() => setStep(STEP.REGLE), 2900),
			setTimeout(() => setStep(STEP.PAID), 3500),
			setTimeout(() => setStep(STEP.RECU), 4400),
			setTimeout(() => setStep(STEP.DONE), 5200),
		];
		return () => t.forEach(clearTimeout);
	}, [reduce]);

	const paid = step >= STEP.PAID;

	return (
		<div
			style={{
				position: "relative",
				width: "clamp(340px, 38vw, 520px)",
				background:
					"radial-gradient(120% 120% at 80% 0%, #14706e 0%, var(--brand-900) 55%)",
				borderRadius: 22,
				padding: "44px 32px 40px",
				minHeight: 540,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				overflow: "hidden",
			}}
		>
			{/* soft glow behind the phone */}
			<div
				style={{
					position: "absolute",
					width: 360,
					height: 360,
					borderRadius: 999,
					background:
						"radial-gradient(circle, rgba(37,211,102,0.22), transparent 65%)",
					filter: "blur(6px)",
					top: "22%",
				}}
				aria-hidden
			/>

			{/* Recouvrement card — floating top-left, climbs when the payment lands */}
			<motion.div
				initial={{ opacity: 0, x: -18, y: -6 }}
				animate={{ opacity: 1, x: 0, y: 0 }}
				transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
				style={{
					position: "absolute",
					left: 18,
					bottom: 30,
					zIndex: 4,
					background: "rgba(255,255,255,0.97)",
					borderRadius: 14,
					padding: "13px 15px",
					width: 188,
					boxShadow: "0 18px 40px -16px rgba(0,0,0,0.5)",
				}}
			>
				<div
					style={{
						fontSize: 11,
						fontWeight: 600,
						letterSpacing: "0.02em",
						color: "var(--fg3)",
						textTransform: "uppercase",
					}}
				>
					Recouvrement · juin
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						gap: 6,
						margin: "4px 0 8px",
					}}
				>
					<AnimatePresence mode="popLayout">
						<motion.span
							key={paid ? "87" : "84"}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.3 }}
							style={{
								fontSize: 26,
								fontWeight: 800,
								letterSpacing: "-0.02em",
								color: "var(--brand-900)",
								lineHeight: 1,
							}}
						>
							{paid ? "87" : "84"}%
						</motion.span>
					</AnimatePresence>
					<span style={{ fontSize: 11, color: WA_SEND, fontWeight: 700 }}>
						▲ +3
					</span>
				</div>
				<div
					style={{
						height: 7,
						borderRadius: 999,
						background: "#eaf0ef",
						overflow: "hidden",
					}}
				>
					<motion.div
						initial={{ width: "84%" }}
						animate={{ width: paid ? "87%" : "84%" }}
						transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
						style={{
							height: "100%",
							borderRadius: 999,
							background: `linear-gradient(90deg, var(--brand-500), ${WA_SEND})`,
						}}
					/>
				</div>
				<div style={{ marginTop: 8, fontSize: 12, color: "var(--fg2)" }}>
					Encaissé{" "}
					<AnimatePresence mode="popLayout">
						<motion.b
							key={paid ? "184" : "177"}
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: 0.3 }}
							style={{ color: "var(--fg1)", fontWeight: 700 }}
						>
							{paid ? "184 500" : "177 000"} DA
						</motion.b>
					</AnimatePresence>
				</div>
			</motion.div>

			{/* "+7 500 DA" toast — fires the instant the payment is confirmed */}
			<AnimatePresence>
				{paid && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
						style={{
							position: "absolute",
							right: 22,
							top: 30,
							zIndex: 5,
							background: WA_SEND,
							color: "#053b22",
							fontWeight: 800,
							fontSize: 13,
							padding: "9px 13px",
							borderRadius: 12,
							boxShadow: "0 14px 30px -10px rgba(37,211,102,0.7)",
							display: "flex",
							alignItems: "center",
							gap: 7,
						}}
					>
						<span style={{ fontSize: 15 }}>✓</span>
						<span>
							+7 500 DA · Amina
							<span style={{ display: "block", fontWeight: 600, fontSize: 11 }}>
								Reçu envoyé sur WhatsApp
							</span>
						</span>
					</motion.div>
				)}
			</AnimatePresence>

			{/* The phone */}
			<motion.div
				initial={{ opacity: 0, y: 22, rotate: -1.5 }}
				animate={{ opacity: 1, y: 0, rotate: -1.5 }}
				transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
				style={{
					position: "relative",
					zIndex: 3,
					width: 312,
					height: 472,
					background: "#0b0f14",
					borderRadius: 38,
					padding: 9,
					boxShadow:
						"0 40px 80px -28px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)",
				}}
			>
				<div
					style={{
						position: "relative",
						width: "100%",
						height: "100%",
						borderRadius: 30,
						overflow: "hidden",
						background: WA_BG,
						display: "flex",
						flexDirection: "column",
					}}
				>
					{/* WhatsApp header */}
					<div
						style={{
							background: WA_HEADER,
							color: "#fff",
							padding: "12px 14px 11px",
							display: "flex",
							alignItems: "center",
							gap: 10,
						}}
					>
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: 999,
								background: "linear-gradient(135deg,#1a7a89,#0f515c)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontWeight: 700,
								fontSize: 15,
								flexShrink: 0,
							}}
						>
							E
						</div>
						<div style={{ lineHeight: 1.25, flex: 1, minWidth: 0 }}>
							<div style={{ fontWeight: 600, fontSize: 14 }}>École El Nour</div>
							<div style={{ fontSize: 11, color: "#bfe6df" }}>
								compte professionnel ✓
							</div>
						</div>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="#cfe9e3"
							aria-hidden
						>
							<title>WhatsApp</title>
							<path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.3-.2-2.4.6.6-2.3-.2-.4A8 8 0 0 1 12 4z" />
						</svg>
					</div>

					{/* Chat */}
					<div
						style={{
							flex: 1,
							padding: "14px 12px",
							display: "flex",
							flexDirection: "column",
							gap: 9,
							overflow: "hidden",
						}}
					>
						<div style={{ textAlign: "center" }}>
							<span
								style={{
									background: "#d3e3e0",
									color: "#41675f",
									fontSize: 11,
									fontWeight: 600,
									padding: "3px 11px",
									borderRadius: 8,
								}}
							>
								AUJOURD'HUI
							</span>
						</div>

						{/* Outgoing — the reminder */}
						{step >= STEP.RAPPEL && (
							<motion.div
								{...bubble()}
								style={{ alignSelf: "flex-end", maxWidth: "85%" }}
							>
								<div
									style={{
										background: WA_OUT,
										borderRadius: "12px 12px 4px 12px",
										padding: "8px 11px 6px",
										fontSize: 13,
										color: "#0b231d",
										boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
									}}
								>
									Bonjour 👋 Rappel — tranche de mai : <b>7 500 DA</b> pour{" "}
									<b>Amina</b> (Maths · 3AS). Échéance 05/06.
									<div
										style={{
											display: "flex",
											justifyContent: "flex-end",
											alignItems: "center",
											gap: 4,
											marginTop: 3,
											fontSize: 10,
											color: "#6b8a82",
										}}
									>
										08:01 <Ticks read={step >= STEP.REGLE} />
									</div>
								</div>
							</motion.div>
						)}

						{/* Parent typing → reply */}
						{step === STEP.TYPING && (
							<motion.div {...bubble()} style={{ alignSelf: "flex-start" }}>
								<div
									style={{
										background: "#fff",
										borderRadius: "12px 12px 12px 4px",
										padding: "9px 12px",
										boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
									}}
								>
									<TypingDots />
								</div>
							</motion.div>
						)}
						{step >= STEP.REGLE && (
							<motion.div
								{...bubble()}
								style={{ alignSelf: "flex-start", maxWidth: "85%" }}
							>
								<div
									style={{
										background: "#fff",
										borderRadius: "12px 12px 12px 4px",
										padding: "8px 11px 6px",
										fontSize: 13,
										color: "#1a2b2e",
										boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
									}}
								>
									C'est réglé ✅ virement envoyé ce matin.
									<div
										style={{
											textAlign: "right",
											marginTop: 3,
											fontSize: 10,
											color: "#9aa6a3",
										}}
									>
										08:02
									</div>
								</div>
							</motion.div>
						)}

						{/* Outgoing — auto receipt */}
						{step >= STEP.RECU && (
							<motion.div
								{...bubble()}
								style={{ alignSelf: "flex-end", maxWidth: "85%" }}
							>
								<div
									style={{
										background: WA_OUT,
										borderRadius: "12px 12px 4px 12px",
										padding: 7,
										boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
									}}
								>
									<div
										style={{
											display: "flex",
											alignItems: "center",
											gap: 9,
											background: "rgba(0,0,0,0.05)",
											borderRadius: 8,
											padding: "8px 10px",
										}}
									>
										<div
											style={{
												width: 30,
												height: 34,
												borderRadius: 5,
												background: "#fff",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: 15,
											}}
										>
											📄
										</div>
										<div style={{ lineHeight: 1.3 }}>
											<div
												style={{
													fontSize: 12,
													fontWeight: 600,
													color: "#0b231d",
												}}
											>
												Reçu_mai_Amina.pdf
											</div>
											<div style={{ fontSize: 10, color: "#6b8a82" }}>
												Taysir · 84 Ko
											</div>
										</div>
									</div>
									<div
										style={{
											display: "flex",
											justifyContent: "flex-end",
											alignItems: "center",
											gap: 4,
											marginTop: 4,
											fontSize: 10,
											color: "#6b8a82",
										}}
									>
										08:02 <Ticks read />
									</div>
								</div>
							</motion.div>
						)}
					</div>

					{/* Composer (static) */}
					<div
						style={{
							background: "#f0f0f0",
							padding: "8px 10px",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<div
							style={{
								flex: 1,
								background: "#fff",
								borderRadius: 999,
								padding: "8px 13px",
								fontSize: 12,
								color: "#9aa6a3",
							}}
						>
							Message
						</div>
						<div
							style={{
								width: 34,
								height: 34,
								borderRadius: 999,
								background: WA_SEND,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<svg
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="#fff"
								aria-hidden
							>
								<title>Envoyer</title>
								<path d="M3 20.5v-6l8-2-8-2v-6l18 8z" />
							</svg>
						</div>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
