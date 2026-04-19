"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "@/i18n/routing";

interface DropdownItem {
	label: string;
	icon?: React.ReactNode;
	onClick?: () => void;
	href?: string;
	variant?: "default" | "danger";
}

interface DropdownMenuProps {
	items: DropdownItem[];
	trigger?: React.ReactNode;
	align?: "left" | "right";
}

export default function DropdownMenu({
	items,
	trigger,
	align = "right",
}: DropdownMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [coords, setCoords] = useState({ top: 0, left: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside, true);
			// Fermeture au scroll pour éviter le décalage du menu portalisé
			window.addEventListener("scroll", () => setIsOpen(false), true);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside, true);
			window.removeEventListener("scroll", () => setIsOpen(false), true);
		};
	}, [isOpen]);

	const toggleDropdown = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!isOpen && containerRef.current) {
			const rect = containerRef.current.getBoundingClientRect();
			// On place le menu sous le bouton avec un petit décalage
			// Puisque le portail est dans un div 'fixed inset-0', on utilise les coordonnées viewport
			setCoords({
				top: rect.bottom + 8,
				left:
					align === "right"
						? rect.right - 224 // 224px est la largeur w-56
						: rect.left,
			});
		}
		setIsOpen(!isOpen);
	};

	if (!isMounted) return null;

	return (
		<div className="relative inline-block" ref={containerRef}>
			<button
				type="button"
				onClick={toggleDropdown}
				className="p-2 rounded-xl text-gray-400 hover:text-taysir-teal hover:bg-taysir-teal/5 transition-all outline-none focus:ring-2 focus:ring-taysir-teal/20 active:bg-taysir-teal/10"
			>
				{trigger || <MoreVertical size={20} />}
			</button>

			{createPortal(
				<AnimatePresence>
					{isOpen && (
						<div
							className="fixed inset-0 z-[9998]"
							onClick={() => setIsOpen(false)}
						>
							<div className="absolute inset-0 pointer-events-none" />
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: -10 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.95, y: -10 }}
								transition={{ duration: 0.1 }}
								style={{
									position: "absolute",
									top: coords.top,
									left: coords.left,
									width: "224px", // w-56
								}}
								className="z-[9999] origin-top rounded-2xl bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-1 ring-black/5 overflow-hidden border border-taysir-teal/5 pointer-events-auto"
								onClick={(e) => e.stopPropagation()}
							>
								<div className="py-2 bg-white">
									{items.map((item, idx) => {
										const content = (
											<>
												<span className="opacity-60">{item.icon}</span>
												<span className="uppercase tracking-widest text-[10px]">
													{item.label}
												</span>
											</>
										);

										const commonClasses = clsx(
											"flex w-full items-center gap-3 px-5 py-3 text-sm font-bold transition-colors text-left",
											item.variant === "danger"
												? "text-rose-600 hover:bg-rose-50"
												: "text-taysir-teal/80 hover:bg-taysir-teal/5 hover:text-taysir-teal",
										);

										if (item.href) {
											return (
												<Link
													key={idx}
													href={item.href as any}
													onClick={() => setIsOpen(false)}
													className={commonClasses}
												>
													{content}
												</Link>
											);
										}

										return (
											<button
												key={idx}
												type="button"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													item.onClick?.();
													setIsOpen(false);
												}}
												className={commonClasses}
											>
												{content}
											</button>
										);
									})}
								</div>
							</motion.div>
						</div>
					)}
				</AnimatePresence>,
				document.body,
			)}
		</div>
	);
}
