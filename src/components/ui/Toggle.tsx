"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";

interface ToggleProps {
	enabled: boolean;
	onChange: (enabled: boolean) => void;
	label?: string;
	description?: string;
}

export function Toggle({ enabled, onChange, label, description }: ToggleProps) {
	return (
		<div className="flex items-center justify-between gap-4 py-1">
			{(label || description) && (
				<div className="flex flex-col">
					{label && (
						<span className="text-sm font-bold text-ink-900">{label}</span>
					)}
					{description && (
						<span className="text-xs font-medium text-ink-400">{description}</span>
					)}
				</div>
			)}
			<button
				type="button"
				onClick={(e) => {
                    e.stopPropagation();
                    onChange(!enabled);
                }}
				className={clsx(
					"relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out outline-none focus:ring-4 focus:ring-brand-500/10",
					enabled ? "bg-brand-500" : "bg-ink-200",
				)}
			>
				<motion.span
					animate={{ x: enabled ? 20 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
					className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0"
				/>
			</button>
		</div>
	);
}
