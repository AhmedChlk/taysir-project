/* 
   Icônes Architecturales Taysir — Style Blueprint
   - Traits fins 1px - 1.5px
   - currentColor avec opacités multiples (20%, 40%, 100%)
   - Géométrie abstraite & asymétrique
*/

import type React from "react";

interface IconProps {
	className?: string;
	size?: number;
	style?: React.CSSProperties;
}

export function TaysirNodesIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.2" />
			<path d="M12 2v2M12 20v2M2 12h2M20 12h2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
			<path d="M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

export function TaysirDashboardIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" />
			<rect x="14" y="3" width="7" height="12" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
			<rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
			<path d="M14 19h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<circle cx="17.5" cy="19" r="1.5" fill="currentColor" />
		</svg>
	);
}

export function TaysirFinancesIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M2 18h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<path d="M7 18v-6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
			<path d="M12 18V4" stroke="currentColor" strokeWidth="1.5" />
			<path d="M17 18v-9" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
			<circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.1" />
		</svg>
	);
}

export function TaysirStudentsIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
			<path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
			<path d="M12 11v10" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.2" />
		</svg>
	);
}

export function TaysirSettingsIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
			<path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
			<rect x="10.5" y="10.5" width="3" height="3" rx="0.5" fill="currentColor" />
		</svg>
	);
}

export function TaysirFlowIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M2 12h20" stroke="currentColor" strokeWidth="1" opacity="0.2" />
			<path d="M12 2v20" stroke="currentColor" strokeWidth="1" opacity="0.2" />
			<path d="M7 12l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M12 7v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
		</svg>
	);
}

export function GraduationIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M22 10L12 5 2 10l10 5 10-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 002-2v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
		</svg>
	);
}

export function ArrowRightIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ZapIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function TrendUpIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M23 6l-9.5 9.5-5-5L1 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M17 6h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function BuildingIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
			<path d="M9 22v-4a3 3 0 016 0v4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
			<path d="M8 6h2M8 10h2M8 14h2M14 6h2M14 10h2M14 14h2" stroke="currentColor" strokeWidth="1" opacity="0.2" />
		</svg>
	);
}

/* ─── Nouveaux exports pour corriger le build ─── */

export function CheckIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ChevronLeftIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function ChevronRightIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function XIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function CameraIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.5" />
			<path d="M12 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
		</svg>
	);
}

export function DownloadIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function Edit3Icon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function EyeIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

export function MailIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5" />
			<path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

export function MapPinIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

export function PhoneIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.79 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.9.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

export function ShieldCheckIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" />
			<path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export function Trash2Icon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
			<path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
		</svg>
	);
}

export function UserIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

export function TaysirSearchIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
			<path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	);
}

export function MenuIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
		</svg>
	);
}

export function CrossIcon({ className, size = 24, style }: IconProps) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} style={style}>
			<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}
