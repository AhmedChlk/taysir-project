"use client";

import { AnimatePresence, motion } from "framer-motion";
import { fmtDA, PATHS, type RowStatus, type Student } from "./demo-data";

/* ==========================================================================
   demo-parts — presentational pieces of the live hero demo.
   Pure view: every interaction is delegated to the parent via callbacks so
   the same parts are driven by the scripted ghost cursor and by the visitor.
   ========================================================================== */

export const Ic = ({ d, size = 14 }: { d: string; size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.9"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden
	>
		<path d={d} />
	</svg>
);

export const WaBubble = ({
	side,
	time,
	animated,
	children,
}: {
	side: "in" | "out";
	time: string;
	animated?: boolean;
	children: React.ReactNode;
}) => (
	<motion.div
		initial={animated ? { opacity: 0, y: 12, scale: 0.92 } : false}
		animate={{ opacity: 1, y: 0, scale: 1 }}
		exit={{ opacity: 0, y: 6 }}
		transition={{ type: "spring", stiffness: 320, damping: 24 }}
		style={{
			alignSelf: side === "in" ? "flex-start" : "flex-end",
			maxWidth: "88%",
			background: side === "in" ? "#fff" : "#DCF8C6",
			borderRadius: side === "in" ? "2px 10px 10px 10px" : "10px 2px 10px 10px",
			padding: "6px 8px 4px",
			fontSize: 9.5,
			lineHeight: 1.45,
			color: "#2B3338",
			boxShadow: "0 1px 1px rgba(8,30,34,0.08)",
		}}
	>
		{children}
		<span
			style={{
				display: "flex",
				justifyContent: "flex-end",
				gap: 3,
				fontSize: 7.5,
				color: "#9AA4AB",
				marginTop: 2,
			}}
		>
			{time}
			{side === "out" && <span style={{ color: "#34B7F1" }}>✓✓</span>}
		</span>
	</motion.div>
);

export const Chip = ({
	label,
	active,
	alert,
	onClick,
}: {
	label: string;
	active: boolean;
	alert?: boolean;
	onClick: () => void;
}) => (
	<button
		type="button"
		onClick={onClick}
		style={{
			fontSize: 10.5,
			fontWeight: 700,
			padding: "5px 13px",
			borderRadius: 999,
			border: "1px solid",
			borderColor: active ? "var(--brand-500)" : "#E5E9EC",
			background: active ? "var(--brand-500)" : "#fff",
			color: active ? "#fff" : alert ? "#B45309" : "#5B6770",
			cursor: "pointer",
			display: "inline-flex",
			alignItems: "center",
			gap: 5,
			transition: "all 0.18s ease",
			boxShadow: active ? "0 4px 10px -3px rgba(26,122,137,0.45)" : "none",
		}}
	>
		{alert && !active && (
			<span
				style={{
					width: 6,
					height: 6,
					borderRadius: 999,
					background: "#d97706",
				}}
			/>
		)}
		{label}
	</button>
);

export const Row = ({
	student,
	status,
	onEncaisser,
	onRelancer,
}: {
	student: Student;
	status: RowStatus;
	onEncaisser: () => void;
	onRelancer: () => void;
}) => {
	const isPaid = status === "paid" || status === "justPaid";
	const pill = isPaid
		? { bg: "#DCFCE7", fg: "#15803D", dot: "#16a34a", label: "À jour" }
		: status === "relanced"
			? { bg: "#E0E7FF", fg: "#3730A3", dot: "#6366f1", label: "Relancé" }
			: { bg: "#FEF3C7", fg: "#92400E", dot: "#d97706", label: "Impayé" };
	return (
		<motion.div
			layout
			initial={{ opacity: 0, height: 0 }}
			animate={{
				opacity: 1,
				height: 47,
				backgroundColor:
					status === "justPaid" ? "rgba(220,252,231,0.5)" : "rgba(0,0,0,0)",
			}}
			exit={{ opacity: 0, height: 0 }}
			transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
			style={{
				display: "grid",
				gridTemplateColumns: "1fr 62px 46px 66px 118px",
				alignItems: "center",
				gap: 6,
				borderBottom: "1px solid #F4F6F7",
				fontSize: 11,
				overflow: "hidden",
				padding: "0 8px",
				borderRadius: 8,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 8,
					minWidth: 0,
				}}
			>
				<div
					style={{
						width: 26,
						height: 26,
						borderRadius: 999,
						background: student.grad,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 9,
						fontWeight: 700,
						color: "#fff",
						flexShrink: 0,
					}}
				>
					{student.name
						.split(" ")
						.map((x) => x[0])
						.join("")}
				</div>
				<div style={{ minWidth: 0 }}>
					<div
						style={{
							color: "var(--fg1)",
							fontWeight: 600,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
							fontSize: 11,
						}}
					>
						{student.name}
					</div>
					<div style={{ color: "#A5AEB5", fontSize: 9 }}>{student.group}</div>
				</div>
			</div>
			<span
				style={{
					fontWeight: 700,
					color: isPaid ? "#A5AEB5" : "var(--fg1)",
					textDecorationLine: isPaid ? "line-through" : "none",
					textDecorationColor: "#C3CBD1",
					fontSize: 10.5,
				}}
			>
				{fmtDA(student.due)}
			</span>
			<span style={{ fontSize: 10, color: isPaid ? "#A5AEB5" : "#5B6770" }}>
				{isPaid ? `payé ${student.deadline}` : student.deadline}
			</span>
			<span
				style={{
					fontSize: 9,
					fontWeight: 700,
					padding: "3px 8px",
					borderRadius: 999,
					background: pill.bg,
					color: pill.fg,
					justifySelf: "start",
					display: "inline-flex",
					alignItems: "center",
					gap: 4,
					whiteSpace: "nowrap",
				}}
			>
				<span
					style={{
						width: 5,
						height: 5,
						borderRadius: 999,
						background: pill.dot,
					}}
				/>
				{pill.label}
			</span>
			{isPaid ? (
				<span
					style={{
						fontSize: 9.5,
						fontWeight: 600,
						color: "#A5AEB5",
						display: "inline-flex",
						alignItems: "center",
						gap: 4,
					}}
				>
					<Ic d={PATHS.receipt} size={10} />
					Reçu PDF
				</span>
			) : (
				<span style={{ display: "flex", gap: 5, alignItems: "center" }}>
					{status !== "relanced" ? (
						<button
							type="button"
							onClick={onRelancer}
							title="Relancer le parent sur WhatsApp"
							aria-label="Relancer le parent sur WhatsApp"
							style={{
								width: 22,
								height: 22,
								borderRadius: 999,
								border: "1px solid #C9EBD4",
								background: "#F0FDF4",
								cursor: "pointer",
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								padding: 0,
								flexShrink: 0,
							}}
						>
							<svg
								width="11"
								height="11"
								viewBox="0 0 24 24"
								fill="#25D366"
								aria-hidden
							>
								<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.5 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z" />
							</svg>
						</button>
					) : (
						<span
							title="Parent relancé sur WhatsApp"
							style={{
								fontSize: 8.5,
								fontWeight: 700,
								color: "#3730A3",
								flexShrink: 0,
							}}
						>
							✓
						</span>
					)}
					<button
						type="button"
						onClick={onEncaisser}
						style={{
							fontSize: 9.5,
							fontWeight: 700,
							padding: "5px 9px",
							borderRadius: 7,
							border: "none",
							background: "var(--brand-500)",
							color: "#fff",
							cursor: "pointer",
							boxShadow: "0 3px 8px -2px rgba(26,122,137,0.45)",
						}}
					>
						Encaisser
					</button>
				</span>
			)}
		</motion.div>
	);
};

export { AnimatePresence, motion };
