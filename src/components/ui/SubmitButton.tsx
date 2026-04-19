"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	isLoading?: boolean;
	loadingText?: string;
	children: React.ReactNode;
}

export function SubmitButton({
	isLoading,
	loadingText = "Traitement...",
	children,
	className,
	...props
}: SubmitButtonProps) {
	return (
		<motion.button
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			disabled={isLoading || props.disabled}
			className={clsx(
				"btn-primary w-full flex items-center justify-center gap-2 min-h-[50px]",
				isLoading && "opacity-80 cursor-not-allowed",
				className,
			)}
			{...(props as any)}
		>
			{isLoading ? (
				<>
					<Loader2 className="animate-spin" size={20} />
					<span>{loadingText}</span>
				</>
			) : (
				children
			)}
		</motion.button>
	);
}
