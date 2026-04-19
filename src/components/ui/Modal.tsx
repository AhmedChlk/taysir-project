"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

export default function Modal({
	isOpen,
	onClose,
	title,
	children,
	footer,
}: ModalProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", handleEsc);

		return () => {
			document.body.style.overflow = "unset";
			window.removeEventListener("keydown", handleEsc);
		};
	}, [isOpen, onClose]);

	if (!isOpen || !mounted) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
			<div
				className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
				onClick={onClose}
			/>

			<div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
					<h3 className="text-lg font-bold text-gray-900">{title}</h3>
					<button
						onClick={onClose}
						className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				{/* Body */}
				<div className="px-6 py-6 max-h-[70vh] overflow-y-auto">{children}</div>

				{/* Footer */}
				{footer && (
					<div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
						{footer}
					</div>
				)}
			</div>
		</div>,
		document.body,
	);
}
