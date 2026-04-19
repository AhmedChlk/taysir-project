"use client";

import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	actionLabel?: string;
	onAction?: () => void;
	className?: string;
}

export default function EmptyState({
	icon: Icon,
	title,
	description,
	actionLabel,
	onAction,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={clsx(
				"flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100 animate-in fade-in zoom-in duration-500",
				className,
			)}
		>
			<div className="p-6 bg-gray-50 rounded-full mb-6">
				<Icon size={48} className="text-gray-300" />
			</div>
			<h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
			<p className="text-gray-500 max-w-sm mb-8">{description}</p>
			{actionLabel && onAction && (
				<button
					onClick={onAction}
					className="flex items-center gap-2 rounded-lg bg-primary-teal px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-accent-teal hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 ease-in-out"
				>
					{actionLabel}
				</button>
			)}
		</div>
	);
}
