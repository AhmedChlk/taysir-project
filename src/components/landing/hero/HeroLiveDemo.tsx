"use client";

import { fmtDA, PATHS, STUDENTS } from "./demo-data";
import { AnimatePresence, Chip, Ic, motion, Row, WaBubble } from "./demo-parts";
import { useHeroDemo } from "./useHeroDemo";

/* ==========================================================================
   HeroLiveDemo — the live test of real Taysir features.
   A refined "Paiements" screen with a parent's phone overlapping it. A ghost
   cursor performs the real workflow (filtrer impayés → encaisser → confirmer
   → relancer WhatsApp); the visitor can take over — hovering pauses the loop
   ("À vous de jouer") and every chip/bouton does what the app really does.
   ========================================================================== */

export const HeroLiveDemo = () => {
	const d = useHeroDemo();

	return (
		<div className="hero-canvas">
			<div className="hero-app-sizer">
				{/* biome-ignore lint/a11y/noStaticElementInteractions: hover only pauses the ambient demo loop — keyboard/AT users lose nothing */}
				<div
					className="hero-app-scale"
					onMouseEnter={d.onHoverStart}
					onMouseLeave={d.onHoverEnd}
				>
					{/* ================= desktop app screen ================= */}
					<div
						role="img"
						aria-label="Démonstration interactive : gestion des paiements et relance des impayés dans Taysir"
						style={{
							width: 640,
							height: 560,
							background: "#fff",
							borderRadius: 18,
							boxShadow:
								"0 60px 120px -32px rgba(15,81,92,0.35), 0 20px 48px -20px rgba(8,30,34,0.2), 0 0 0 1px rgba(15,81,92,0.07)",
							overflow: "hidden",
							position: "relative",
							fontFamily: "inherit",
						}}
					>
						{/* ---- topbar ---- */}
						<div
							style={{
								height: 52,
								borderBottom: "1px solid #F1F3F5",
								display: "flex",
								alignItems: "center",
								padding: "0 16px",
								gap: 14,
							}}
						>
							<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
								<span
									style={{
										width: 26,
										height: 26,
										borderRadius: 8,
										background:
											"linear-gradient(135deg, var(--brand-500), var(--brand-900))",
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										color: "#fff",
										fontSize: 14,
										fontWeight: 800,
									}}
								>
									+
								</span>
								<span
									style={{
										fontSize: 15,
										fontWeight: 800,
										color: "var(--brand-900)",
										letterSpacing: "-0.02em",
									}}
								>
									taysir
								</span>
							</div>
							<div
								style={{
									flex: 1,
									maxWidth: 190,
									height: 30,
									background: "#F4F6F7",
									borderRadius: 8,
									display: "flex",
									alignItems: "center",
									gap: 8,
									padding: "0 10px",
									color: "#9AA4AB",
									fontSize: 10.5,
								}}
							>
								<Ic d={PATHS.search} size={12} />
								Rechercher un élève…
							</div>
							<div
								style={{
									marginLeft: "auto",
									display: "flex",
									alignItems: "center",
									gap: 12,
								}}
							>
								<span
									style={{
										fontSize: 9.5,
										fontWeight: 700,
										letterSpacing: "0.07em",
										textTransform: "uppercase",
										color: d.paused ? "var(--brand-500)" : "#A5AEB5",
										display: "inline-flex",
										alignItems: "center",
										gap: 5,
									}}
								>
									<motion.span
										animate={{ opacity: d.paused ? 1 : [1, 0.3, 1] }}
										transition={
											d.paused
												? { duration: 0.2 }
												: { duration: 1.6, repeat: Infinity }
										}
										style={{
											width: 6,
											height: 6,
											borderRadius: 999,
											background: d.paused ? "var(--brand-500)" : "#22c55e",
										}}
									/>
									{d.paused ? "À vous de jouer" : "Démo live"}
								</span>
								<span style={{ position: "relative", color: "#5B6770" }}>
									<Ic d={PATHS.bell} size={15} />
									<span
										style={{
											position: "absolute",
											top: -2,
											right: -2,
											width: 7,
											height: 7,
											borderRadius: 999,
											background: "#ef4444",
											border: "1.5px solid #fff",
										}}
									/>
								</span>
								<span
									style={{
										width: 28,
										height: 28,
										borderRadius: 999,
										background: "linear-gradient(135deg,#6366f1,#4338ca)",
										color: "#fff",
										fontSize: 10.5,
										fontWeight: 700,
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									SB
								</span>
							</div>
						</div>

						<div style={{ display: "flex", height: 508 }}>
							{/* ---- sidebar ---- */}
							<div
								style={{
									width: 150,
									borderRight: "1px solid #F1F3F5",
									background: "#FAFBFC",
									padding: "12px 10px",
									display: "flex",
									flexDirection: "column",
									gap: 2,
								}}
							>
								<div
									style={{
										fontSize: 9,
										fontWeight: 700,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "#A5AEB5",
										padding: "2px 10px 8px",
									}}
								>
									École El Nour
								</div>
								{[
									{ label: "Tableau de bord", icon: PATHS.grid },
									{ label: "Élèves", icon: PATHS.users, count: "248" },
									{
										label: "Paiements",
										icon: PATHS.wallet,
										active: true,
										count: String(d.unpaidNow.length),
										alert: d.unpaidNow.length > 0,
									},
									{ label: "Emploi du temps", icon: PATHS.calendar },
									{ label: "Présences", icon: PATHS.check },
									{ label: "Salles", icon: PATHS.door },
								].map((item) => (
									<div
										key={item.label}
										style={{
											fontSize: 11,
											fontWeight: item.active ? 700 : 500,
											color: item.active ? "#fff" : "#4B5760",
											background: item.active
												? "var(--brand-500)"
												: "transparent",
											borderRadius: 8,
											padding: "7px 10px",
											display: "flex",
											alignItems: "center",
											gap: 8,
											boxShadow: item.active
												? "0 5px 12px -3px rgba(26,122,137,0.5)"
												: "none",
										}}
									>
										<Ic d={item.icon} size={13} />
										<span style={{ flex: 1 }}>{item.label}</span>
										{item.count && (
											<span
												style={{
													fontSize: 9,
													fontWeight: 700,
													padding: "1px 6px",
													borderRadius: 999,
													background: item.active
														? "rgba(255,255,255,0.22)"
														: item.alert
															? "#FEF3C7"
															: "#EEF1F3",
													color: item.active
														? "#fff"
														: item.alert
															? "#B45309"
															: "#7B8590",
												}}
											>
												{item.count}
											</span>
										)}
									</div>
								))}
								<div
									style={{
										marginTop: "auto",
										borderTop: "1px solid #EEF1F3",
										paddingTop: 8,
										display: "flex",
										alignItems: "center",
										gap: 8,
										padding: "8px 10px 0",
										fontSize: 11,
										color: "#4B5760",
									}}
								>
									<Ic d={PATHS.gear} size={13} />
									Paramètres
								</div>
							</div>

							{/* ---- main ---- */}
							<div
								style={{
									flex: 1,
									padding: "14px 16px 0",
									position: "relative",
									display: "flex",
									flexDirection: "column",
								}}
							>
								{/* header + actions */}
								<div
									style={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<div>
										<div
											style={{
												fontSize: 16,
												fontWeight: 800,
												color: "var(--fg1)",
												letterSpacing: "-0.02em",
											}}
										>
											Paiements
										</div>
										<div
											style={{ fontSize: 10, color: "#8A949C", marginTop: 1 }}
										>
											Juin 2026 · 248 élèves · 12 classes
										</div>
									</div>
									<div style={{ display: "flex", gap: 6 }}>
										<span
											style={{
												display: "inline-flex",
												alignItems: "center",
												gap: 5,
												fontSize: 10.5,
												fontWeight: 700,
												padding: "6px 11px",
												borderRadius: 8,
												background:
													"linear-gradient(135deg, var(--brand-500), var(--brand-700))",
												color: "#fff",
												boxShadow: "0 5px 12px -4px rgba(26,122,137,0.55)",
											}}
										>
											<Ic d={PATHS.plus} size={11} />
											Nouveau paiement
										</span>
										<span
											style={{
												display: "inline-flex",
												alignItems: "center",
												gap: 5,
												fontSize: 10.5,
												fontWeight: 600,
												padding: "6px 10px",
												borderRadius: 8,
												border: "1px solid #E5E9EC",
												color: "#4B5760",
												background: "#fff",
											}}
										>
											<Ic d={PATHS.receipt} size={11} />
											Reçus PDF
										</span>
									</div>
								</div>

								{/* KPI cards */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1.25fr 1fr 1.15fr",
										gap: 8,
										marginTop: 12,
									}}
								>
									<div
										style={{
											background:
												"linear-gradient(135deg, var(--brand-900), var(--brand-700))",
											borderRadius: 12,
											padding: "10px 13px",
											color: "#fff",
										}}
									>
										<div
											style={{
												fontSize: 9,
												fontWeight: 600,
												opacity: 0.75,
												letterSpacing: "0.04em",
												textTransform: "uppercase",
											}}
										>
											Encaissé ce mois
										</div>
										<AnimatePresence mode="popLayout" initial={false}>
											<motion.div
												key={d.collected}
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -8 }}
												transition={{ duration: 0.3 }}
												style={{
													fontSize: 17,
													fontWeight: 800,
													letterSpacing: "-0.01em",
													marginTop: 3,
												}}
											>
												{fmtDA(d.collected)}
											</motion.div>
										</AnimatePresence>
										<div style={{ fontSize: 9, opacity: 0.75, marginTop: 2 }}>
											↗ +12 % vs mai
										</div>
									</div>
									<div
										style={{
											background: "#fff",
											border: "1px solid #EEF1F3",
											borderRadius: 12,
											padding: "10px 13px",
											display: "flex",
											alignItems: "center",
											gap: 10,
										}}
									>
										<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
											<circle
												cx="20"
												cy="20"
												r="16"
												fill="none"
												stroke="#E6F2F4"
												strokeWidth="5"
											/>
											<motion.circle
												cx="20"
												cy="20"
												r="16"
												fill="none"
												stroke="var(--brand-500)"
												strokeWidth="5"
												strokeLinecap="round"
												strokeDasharray={2 * Math.PI * 16}
												initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
												animate={{
													strokeDashoffset:
														2 * Math.PI * 16 * (1 - d.rate / 100),
												}}
												transition={{ duration: 0.9, ease: "easeOut" }}
												transform="rotate(-90 20 20)"
											/>
										</svg>
										<div>
											<div
												style={{
													fontSize: 15,
													fontWeight: 800,
													color: "var(--fg1)",
												}}
											>
												{d.rate} %
											</div>
											<div style={{ fontSize: 9, color: "#8A949C" }}>
												recouvrement
											</div>
										</div>
									</div>
									<div
										style={{
											background: d.outstanding > 25000 ? "#FFFBEB" : "#F0FDF4",
											border: `1px solid ${d.outstanding > 25000 ? "#FDE68A" : "#BBF7D0"}`,
											borderRadius: 12,
											padding: "10px 13px",
										}}
									>
										<div
											style={{
												fontSize: 9,
												fontWeight: 600,
												color: d.outstanding > 25000 ? "#92400E" : "#15803D",
												letterSpacing: "0.04em",
												textTransform: "uppercase",
											}}
										>
											Impayés
										</div>
										<AnimatePresence mode="popLayout" initial={false}>
											<motion.div
												key={d.outstanding}
												initial={{ opacity: 0, y: 8 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, y: -8 }}
												transition={{ duration: 0.3 }}
												style={{
													fontSize: 17,
													fontWeight: 800,
													letterSpacing: "-0.01em",
													color: d.outstanding > 25000 ? "#B45309" : "#15803D",
													marginTop: 3,
												}}
											>
												{fmtDA(d.outstanding)}
											</motion.div>
										</AnimatePresence>
										<div
											style={{
												fontSize: 9,
												color: d.outstanding > 25000 ? "#B45309" : "#15803D",
												marginTop: 2,
											}}
										>
											{d.unpaidNow.length} élève
											{d.unpaidNow.length > 1 ? "s" : ""} · relance en 1 clic
										</div>
									</div>
								</div>

								{/* filter chips */}
								<div
									style={{
										display: "flex",
										gap: 6,
										margin: "12px 0 8px",
										alignItems: "center",
									}}
								>
									<Chip
										label={`Tous (${STUDENTS.length})`}
										active={d.filter === "all"}
										onClick={() => d.userAct(() => d.setFilter("all"))}
									/>
									<Chip
										label={`Impayés (${d.unpaidNow.length})`}
										active={d.filter === "unpaid"}
										alert={d.unpaidNow.length > 0}
										onClick={() => d.userAct(() => d.setFilter("unpaid"))}
									/>
									<span
										style={{
											marginLeft: "auto",
											fontSize: 9.5,
											color: "#A5AEB5",
										}}
									>
										Trié par échéance ↓
									</span>
								</div>

								{/* table header */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "1fr 62px 46px 66px 118px",
										gap: 6,
										padding: "0 8px 5px",
										fontSize: 8.5,
										fontWeight: 700,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "#A5AEB5",
										borderBottom: "1px solid #EEF1F3",
									}}
								>
									<span>Élève</span>
									<span>Montant</span>
									<span>Éch.</span>
									<span>Statut</span>
									<span>Actions</span>
								</div>

								{/* rows */}
								<div style={{ flex: 1, overflow: "hidden" }}>
									<AnimatePresence initial={false}>
										{d.visibleRows.map((s) => (
											<Row
												key={s.id}
												student={s}
												status={d.statuses[s.id] ?? s.initialStatus}
												onEncaisser={() => d.userAct(() => d.encaisser(s.id))}
												onRelancer={() => d.userAct(() => d.relancer(s.id))}
											/>
										))}
									</AnimatePresence>
								</div>

								{/* footer */}
								<div
									style={{
										borderTop: "1px solid #F1F3F5",
										padding: "7px 8px 10px",
										fontSize: 9.5,
										color: "#A5AEB5",
										display: "flex",
										justifyContent: "space-between",
									}}
								>
									<span>
										{d.visibleRows.length} élèves affichés · 248 au total
									</span>
									<span>Reçus envoyés automatiquement par WhatsApp ✓</span>
								</div>

								{/* toast */}
								<AnimatePresence>
									{d.toast && (
										<motion.div
											initial={{ opacity: 0, y: -14, scale: 0.95 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: -10 }}
											transition={{
												type: "spring",
												stiffness: 380,
												damping: 26,
											}}
											style={{
												position: "absolute",
												top: 10,
												right: 14,
												background: "#0f515c",
												color: "#fff",
												borderRadius: 10,
												padding: "9px 13px",
												fontSize: 11,
												fontWeight: 600,
												display: "flex",
												alignItems: "center",
												gap: 9,
												boxShadow: "0 16px 34px -10px rgba(15,81,92,0.55)",
												zIndex: 4,
											}}
										>
											<span
												style={{
													width: 17,
													height: 17,
													borderRadius: 999,
													background: "#16a34a",
													display: "inline-flex",
													alignItems: "center",
													justifyContent: "center",
													fontSize: 10,
												}}
											>
												✓
											</span>
											<span>
												Paiement enregistré · {fmtDA(d.toast.amount)}
												<span
													style={{
														display: "block",
														fontSize: 9,
														fontWeight: 500,
														opacity: 0.8,
													}}
												>
													Reçu PDF envoyé au parent
												</span>
											</span>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						</div>

						{/* ---- modal ---- */}
						<AnimatePresence>
							{d.modalFor && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									style={{
										position: "absolute",
										inset: 0,
										background: "rgba(8,30,34,0.42)",
										backdropFilter: "blur(3px)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										zIndex: 5,
										paddingLeft: 150,
									}}
								>
									<motion.div
										initial={{ opacity: 0, y: 16, scale: 0.96 }}
										animate={{ opacity: 1, y: 0, scale: 1 }}
										exit={{ opacity: 0, y: 10, scale: 0.97 }}
										transition={{ type: "spring", stiffness: 360, damping: 28 }}
										style={{
											width: 296,
											background: "#fff",
											borderRadius: 16,
											padding: 20,
											boxShadow: "0 34px 70px -18px rgba(8,30,34,0.45)",
										}}
									>
										{(() => {
											const s = STUDENTS.find((x) => x.id === d.modalFor);
											if (!s) return null;
											return (
												<>
													<div
														style={{
															fontSize: 13.5,
															fontWeight: 800,
															color: "var(--fg1)",
															letterSpacing: "-0.01em",
														}}
													>
														Encaisser un paiement
													</div>
													<div
														style={{
															fontSize: 11,
															color: "#6B7680",
															margin: "4px 0 13px",
														}}
													>
														{s.name} — {s.group}
													</div>
													<div
														style={{
															background: "var(--brand-50)",
															borderRadius: 10,
															padding: "10px 13px",
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
															marginBottom: 10,
														}}
													>
														<span style={{ fontSize: 10.5, color: "#4B5760" }}>
															Montant dû · juin
														</span>
														<span
															style={{
																fontSize: 16,
																fontWeight: 800,
																color: "var(--brand-900)",
															}}
														>
															{fmtDA(s.due)}
														</span>
													</div>
													<div
														style={{
															display: "flex",
															gap: 6,
															marginBottom: 15,
														}}
													>
														{["Espèces", "Virement", "Chèque"].map((m, i) => (
															<span
																key={m}
																style={{
																	fontSize: 10,
																	fontWeight: 600,
																	padding: "4px 11px",
																	borderRadius: 999,
																	background:
																		i === 0 ? "var(--brand-500)" : "#F3F5F6",
																	color: i === 0 ? "#fff" : "#5B6770",
																}}
															>
																{m}
															</span>
														))}
													</div>
													<button
														type="button"
														onClick={() => d.userAct(d.confirmer)}
														style={{
															width: "100%",
															background:
																"linear-gradient(135deg, var(--brand-500), var(--brand-700))",
															color: "#fff",
															border: "none",
															borderRadius: 10,
															padding: "10px 0",
															fontSize: 12,
															fontWeight: 700,
															cursor: "pointer",
															boxShadow:
																"0 10px 22px -8px rgba(26,122,137,0.6)",
														}}
													>
														Confirmer l'encaissement
													</button>
													<div
														style={{
															fontSize: 9,
															color: "#A5AEB5",
															textAlign: "center",
															marginTop: 8,
														}}
													>
														Reçu PDF + notification parent automatiques
													</div>
												</>
											);
										})()}
									</motion.div>
								</motion.div>
							)}
						</AnimatePresence>

						{/* ---- ghost cursor ---- */}
						{!d.reduced && (
							<motion.div
								animate={{
									x: d.cursor.x,
									y: d.cursor.y,
									scale: d.clicking ? 0.8 : 1,
									opacity: d.paused ? 0 : 1,
								}}
								transition={{
									x: { type: "spring", stiffness: 110, damping: 19 },
									y: { type: "spring", stiffness: 110, damping: 19 },
									scale: { duration: 0.15 },
									opacity: { duration: 0.25 },
								}}
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									zIndex: 30,
									pointerEvents: "none",
								}}
							>
								<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
									<path
										d="M5 3l14 8.5-6.2 1.4L9.5 19 5 3z"
										fill="#0f515c"
										stroke="#fff"
										strokeWidth="1.6"
										strokeLinejoin="round"
									/>
								</svg>
								<AnimatePresence>
									{d.clicking && (
										<motion.span
											initial={{ opacity: 0.55, scale: 0.3 }}
											animate={{ opacity: 0, scale: 1.9 }}
											exit={{ opacity: 0 }}
											transition={{ duration: 0.5 }}
											style={{
												position: "absolute",
												top: -10,
												left: -10,
												width: 42,
												height: 42,
												borderRadius: 999,
												border: "2px solid var(--brand-500)",
												background: "rgba(26,122,137,0.18)",
											}}
										/>
									)}
								</AnimatePresence>
							</motion.div>
						)}
					</div>

					{/* ================= parent's phone (WhatsApp) ================= */}
					<div
						style={{
							position: "absolute",
							right: -138,
							bottom: -30,
							width: 184,
							height: 376,
							background: "linear-gradient(160deg,#23272D 0%,#0B0D10 100%)",
							borderRadius: 34,
							padding: 5,
							boxShadow:
								"0 44px 90px -22px rgba(8,30,34,0.5), 0 12px 32px -8px rgba(0,0,0,0.3)",
							zIndex: 8,
						}}
					>
						<div
							style={{
								width: "100%",
								height: "100%",
								borderRadius: 29,
								overflow: "hidden",
								display: "flex",
								flexDirection: "column",
								background: "#EFEAE2",
								position: "relative",
							}}
						>
							{/* notch */}
							<div
								style={{
									position: "absolute",
									top: 6,
									left: "50%",
									transform: "translateX(-50%)",
									width: 64,
									height: 14,
									borderRadius: 999,
									background: "#0B0D10",
									zIndex: 3,
								}}
							/>
							{/* WA header */}
							<div
								style={{
									background: "#075E54",
									color: "#fff",
									padding: "24px 12px 9px",
									display: "flex",
									alignItems: "center",
									gap: 8,
								}}
							>
								<span
									style={{
										width: 26,
										height: 26,
										borderRadius: 999,
										background:
											"linear-gradient(135deg, var(--brand-500), var(--brand-900))",
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 11,
										fontWeight: 800,
									}}
								>
									E
								</span>
								<div style={{ lineHeight: 1.15 }}>
									<div style={{ fontSize: 11, fontWeight: 700 }}>
										École El Nour
									</div>
									<div style={{ fontSize: 8.5, opacity: 0.8 }}>
										compte professionnel ✓
									</div>
								</div>
							</div>
							{/* chat */}
							<div
								style={{
									flex: 1,
									padding: "10px 9px",
									display: "flex",
									flexDirection: "column",
									gap: 7,
									backgroundImage:
										"radial-gradient(circle at 20% 20%, rgba(15,81,92,0.04) 0, transparent 50%), radial-gradient(circle at 80% 60%, rgba(15,81,92,0.05) 0, transparent 50%)",
								}}
							>
								<WaBubble side="in" time="08:02">
									Reçu de paiement — mai.pdf 📄
									<span
										style={{
											display: "block",
											fontSize: 8,
											color: "#7B8590",
											marginTop: 2,
										}}
									>
										Document · 84 Ko
									</span>
								</WaBubble>
								<AnimatePresence>
									{d.waMsg && (
										<WaBubble side="in" time="09:14" animated>
											Bonjour 👋 Rappel : scolarité de{" "}
											{d.waMsg.name.split(" ")[0]} —{" "}
											<b>{fmtDA(d.waMsg.amount)}</b> à régler avant le 15/06.
										</WaBubble>
									)}
								</AnimatePresence>
								<AnimatePresence>
									{d.waReply && (
										<WaBubble side="out" time="09:15" animated>
											Merci du rappel ! Je passe demain 🙏
										</WaBubble>
									)}
								</AnimatePresence>
							</div>
							{/* input bar */}
							<div
								style={{
									padding: "6px 8px 10px",
									display: "flex",
									gap: 6,
									alignItems: "center",
								}}
							>
								<div
									style={{
										flex: 1,
										height: 26,
										background: "#fff",
										borderRadius: 999,
										fontSize: 9,
										color: "#A5AEB5",
										display: "flex",
										alignItems: "center",
										padding: "0 10px",
									}}
								>
									Message
								</div>
								<span
									style={{
										width: 26,
										height: 26,
										borderRadius: 999,
										background: "#25D366",
										display: "inline-flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<svg
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="#fff"
										aria-hidden
									>
										<path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
									</svg>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
