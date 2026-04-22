"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

interface BaseProps {
	label: string;
	error?: string;
	helperText?: string;
	success?: boolean;
}

interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement>,
		BaseProps {
	suffix?: string;
}

interface TextAreaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		BaseProps {}

export function Input({
	label,
	error,
	helperText,
	success,
	className,
	type,
	suffix,
	id: propsId,
	...props
}: InputProps) {
	const generatedId = useId();
	const inputId = propsId ?? generatedId;
	const [showPassword, setShowPassword] = useState(false);
	const isPassword = type === "password";

	const togglePassword = () => {
		setShowPassword(!showPassword);
	};

	const inputType = isPassword ? (showPassword ? "text" : "password") : type;

	return (
		<div className="w-full space-y-1.5 group">
			<label
				htmlFor={inputId}
				className="text-sm font-semibold text-ink-700 transition-colors group-focus-within:text-brand-500"
			>
				{label}
			</label>
			<div className="relative">
				<motion.input
					id={inputId}
					whileFocus={{ scale: 1.005 }}
					type={inputType}
					className={clsx(
						"block w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-900 transition-all outline-none",
						error
							? "border-rose-300 focus:border-rose-500 ring-rose-500/10 focus:ring-4"
							: success
								? "border-emerald-300 focus:border-emerald-500 ring-emerald-500/10 focus:ring-4"
								: "border-gray-200 focus:border-brand-500 ring-brand-500/10 focus:ring-4",
						(isPassword || suffix || error || success) && "pe-12",
						className,
					)}
					{...(props as unknown as Record<string, unknown>)}
				/>

				{/* Adornments */}
				<div className="absolute end-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-ink-400">
					{success && !error && (
						<CheckCircle2 size={18} className="text-success" />
					)}
					{error && <AlertCircle size={18} className="text-danger" />}

					{isPassword && (
						<button
							type="button"
							onClick={togglePassword}
							className="hover:text-brand-500 transition-colors focus:outline-none"
						>
							{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					)}

					{suffix && (
						<span className="text-xs font-bold text-ink-400 select-none">
							{suffix}
						</span>
					)}
				</div>
			</div>

			<AnimatePresence mode="wait">
				{error ? (
					<motion.p
						initial={{ opacity: 0, y: -5 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -5 }}
						className="text-xs font-medium text-danger flex items-center gap-1"
					>
						{error}
					</motion.p>
				) : helperText ? (
					<p className="text-xs text-ink-500 italic">{helperText}</p>
				) : null}
			</AnimatePresence>
		</div>
	);
}

export function FormSection({
	title,
	description,
	children,
	className,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={clsx("space-y-4", className)}>
			<div className="border-s-4 border-brand-500/20 ps-4">
				<h3 className="text-lg font-bold text-brand-900 leading-tight">
					{title}
				</h3>
				{description && (
					<p className="text-sm text-ink-500 mt-1">{description}</p>
				)}
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
				{children}
			</div>
		</div>
	);
}

interface SelectProps
	extends React.SelectHTMLAttributes<HTMLSelectElement>,
		BaseProps {
	options: { label: string; value: string | number }[];
}

export function Select({
	label,
	error,
	helperText,
	options = [],
	className,
	id: propsId,
	...props
}: SelectProps) {
	const generatedId = useId();
	const selectId = propsId ?? generatedId;
	const safeOptions = Array.isArray(options) ? options : [];
	return (
		<div className="w-full space-y-1.5 group">
			<label
				htmlFor={selectId}
				className="text-sm font-semibold text-ink-700 transition-colors group-focus-within:text-brand-500"
			>
				{label}
			</label>
			<select
				id={selectId}
				className={clsx(
					"block w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-900 transition-all outline-none focus:ring-4",
					error
						? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
						: "border-gray-200 focus:border-brand-500 focus:ring-brand-500/10",
					className,
				)}
				{...props}
			>
				{safeOptions.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			{error && (
				<p className="text-xs font-medium text-danger mt-1">{error}</p>
			)}
		</div>
	);
}

export function TextArea({
	label,
	error,
	helperText,
	className,
	id: propsId,
	...props
}: TextAreaProps) {
	const generatedId = useId();
	const textareaId = propsId ?? generatedId;
	return (
		<div className="w-full space-y-1.5 group">
			<label
				htmlFor={textareaId}
				className="text-sm font-semibold text-ink-700 transition-colors group-focus-within:text-brand-500"
			>
				{label}
			</label>
			<textarea
				id={textareaId}
				className={clsx(
					"block w-full rounded-xl border bg-white px-4 py-3 text-sm text-ink-900 transition-all outline-none focus:ring-4",
					error
						? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
						: "border-gray-200 focus:border-brand-500 focus:ring-brand-500/10",
					className,
				)}
				rows={3}
				{...props}
			/>
			{error && (
				<p className="text-xs font-medium text-danger mt-1">{error}</p>
			)}
		</div>
	);
}
