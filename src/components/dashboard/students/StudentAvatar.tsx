"use client";

import { useState } from "react";
import { cn } from "@/utils/format";

/* ==========================================================================
   StudentAvatar — robust photo with graceful fallback.
   Uses a plain <img> (handles runtime-uploaded files and data URLs that
   next/image can't optimise) and falls back to brand initials when the photo
   is missing or fails to load — no more broken-image icons.
   ========================================================================== */

interface StudentAvatarProps {
	src?: string | null | undefined;
	name: string;
	/** Box size in px (drives width/height + initials scale). */
	size?: number;
	/** Tailwind radius/shape class. */
	rounded?: string;
	className?: string;
}

export function StudentAvatar({
	src,
	name,
	size = 44,
	rounded = "rounded-2xl",
	className,
}: StudentAvatarProps) {
	const [failed, setFailed] = useState(false);
	const initials =
		name
			.split(" ")
			.map((w) => w[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase() || "?";
	const showImg = !!src && !failed;

	return (
		<div
			className={cn(
				"relative flex shrink-0 items-center justify-center overflow-hidden border border-line/70 bg-gradient-to-br from-brand-500 to-brand-900 font-bold text-white",
				rounded,
				className,
			)}
			style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
		>
			{showImg ? (
				// biome-ignore lint/performance/noImgElement: runtime-uploaded files / data URLs aren't optimisable by next/image; plain img + onError fallback is the robust path
				<img
					src={src ?? undefined}
					alt={name}
					className="absolute inset-0 h-full w-full object-cover"
					onError={() => setFailed(true)}
				/>
			) : (
				<span className="leading-none tracking-tight">{initials}</span>
			)}
		</div>
	);
}
