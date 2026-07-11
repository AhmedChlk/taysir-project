export const LogoMark = ({
	size = 28,
	color = "var(--brand-500)",
}: {
	size?: number;
	color?: string;
}) => (
	<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
		<g fill={color}>
			<rect x="26" y="6" width="12" height="52" rx="3" />
			<rect x="6" y="26" width="52" height="12" rx="3" />
			<rect x="26" y="26" width="12" height="12" fill="#fff" />
			<rect x="28" y="28" width="8" height="8" fill={color} />
		</g>
	</svg>
);

export const Logo = ({
	color = "var(--brand-500)",
	textColor,
}: {
	color?: string;
	textColor?: string;
}) => (
	<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
		<LogoMark size={26} color={color} />
		<span
			style={{
				fontSize: 22,
				fontWeight: 700,
				letterSpacing: "-0.02em",
				color: textColor || "var(--fg1)",
				fontFamily: "var(--font-body)",
			}}
		>
			taysir
		</span>
	</div>
);
