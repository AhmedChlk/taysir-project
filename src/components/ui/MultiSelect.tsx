"use client";

import { clsx } from "clsx";
import { Check, ChevronDown, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface Option {
	label: string;
	value: string;
}

interface MultiSelectProps {
	label: string;
	options: Option[];
	value: string[];
	onChange: (value: string[]) => void;
	placeholder?: string;
}

export default function MultiSelect({
	label,
	options,
	value,
	onChange,
	placeholder,
}: MultiSelectProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleOption = (optionValue: string) => {
		const newValue = value.includes(optionValue)
			? value.filter((v) => v !== optionValue)
			: [...value, optionValue];
		onChange(newValue);
	};

	const removeValue = (e: React.MouseEvent, optionValue: string) => {
		e.stopPropagation();
		onChange(value.filter((v) => v !== optionValue));
	};

	const _selectedLabels = options
		.filter((opt) => value.includes(opt.value))
		.map((opt) => opt.label);

	return (
		<div className="w-full space-y-1.5" ref={containerRef}>
			<label className="text-sm font-semibold text-taysir-teal">{label}</label>
			<div className="relative">
				<div
					onClick={() => setIsOpen(!isOpen)}
					className={clsx(
						"flex min-h-[50px] w-full flex-wrap items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm transition-all outline-none cursor-pointer focus:ring-4 focus:ring-taysir-teal/10",
						isOpen
							? "border-taysir-teal ring-4 ring-taysir-teal/10"
							: "border-taysir-teal/15 hover:border-taysir-teal/30",
					)}
				>
					{value.length > 0 ? (
						<div className="flex flex-wrap gap-1.5">
							{options
								.filter((opt) => value.includes(opt.value))
								.map((opt) => (
									<span
										key={opt.value}
										className="inline-flex items-center gap-1 rounded-lg bg-taysir-teal/5 px-2 py-1 text-[10px] font-black uppercase text-taysir-teal border border-taysir-teal/10"
									>
										{opt.label}
										<X
											size={12}
											className="cursor-pointer hover:text-rose-500"
											onClick={(e) => removeValue(e, opt.value)}
										/>
									</span>
								))}
						</div>
					) : (
						<span className="text-gray-400">
							{placeholder || "Sélectionner..."}
						</span>
					)}
					<ChevronDown
						size={18}
						className={clsx(
							"ms-auto text-gray-400 transition-transform",
							isOpen && "rotate-180",
						)}
					/>
				</div>

				{isOpen && (
					<div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 custom-scrollbar">
						{options.map((option) => (
							<div
								key={option.value}
								onClick={() => toggleOption(option.value)}
								className={clsx(
									"flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer",
									value.includes(option.value)
										? "bg-taysir-teal/5 text-taysir-teal"
										: "text-gray-700 hover:bg-gray-50",
								)}
							>
								<span className="uppercase tracking-widest text-[10px]">
									{option.label}
								</span>
								{value.includes(option.value) && <Check size={16} />}
							</div>
						))}
						{options.length === 0 && (
							<div className="px-4 py-8 text-center text-xs font-bold uppercase text-gray-300 italic">
								Aucune option disponible
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
