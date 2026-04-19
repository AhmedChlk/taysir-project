"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

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
	...props
}: InputProps) {
	const [showPassword, setShowPassword] = useState(false);
	const isPassword = type === "password";

	const togglePassword = () => {
		setShowPassword(!showPassword);
	};

	const inputType = isPassword ? (showPassword ? "text" : "password") : type;

	return (
		<div className="w-full space-y-1.5 group">
			<label className="text-sm font-semibold text-taysir-teal transition-colors group-focus-within:text-taysir-light">
				{label}
			</label>
			<div className="relative">
				<motion.input
					whileFocus={{ scale: 1.01 }}
					type={inputType}
					className={clsx(
						"block w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 transition-all outline-none focus:ring-4",
						error
							? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
							: success
								? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10"
								: "border-taysir-teal/15 focus:border-taysir-teal focus:ring-taysir-teal/10",
						(isPassword || suffix || error || success) && "pe-12",
						className,
					)}
					{...(props as any)}
				/>

				{/* Adornments */}
				<div className="absolute end-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
					{success && !error && (
						<CheckCircle2 size={18} className="text-emerald-500" />
					)}
					{error && <AlertCircle size={18} className="text-rose-500" />}

					{isPassword && (
						<button
							type="button"
							onClick={togglePassword}
							className="hover:text-taysir-teal transition-colors focus:outline-none"
						>
							{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					)}

					{suffix && (
						<span className="text-xs font-bold text-gray-400 select-none">
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
						className="text-xs font-medium text-rose-600 flex items-center gap-1"
					>
						{error}
					</motion.p>
				) : helperText ? (
					<p className="text-xs text-gray-500 italic">{helperText}</p>
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
			<div className="border-s-4 border-taysir-teal/20 ps-4">
				<h3 className="text-lg font-bold text-taysir-teal leading-tight">
					{title}
				</h3>
				{description && (
					<p className="text-sm text-gray-500 mt-1">{description}</p>
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
	...props
}: SelectProps) {
	const safeOptions = Array.isArray(options) ? options : [];
	return (
		<div className="w-full space-y-1.5 group">
			<label className="text-sm font-semibold text-taysir-teal transition-colors group-focus-within:text-taysir-light">
				{label}
			</label>
			<select
				className={clsx(
					"block w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 transition-all outline-none focus:ring-4",
					error
						? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
						: "border-taysir-teal/15 focus:border-taysir-teal focus:ring-taysir-teal/10",
					className,
				)}
				{...(props as any)}
			>
				{safeOptions.map((opt) => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
			{error && (
				<p className="text-xs font-medium text-rose-600 mt-1">{error}</p>
			)}
		</div>
	);
}

export function TextArea({
	label,
	error,
	helperText,
	className,
	...props
}: TextAreaProps) {
	return (
		<div className="w-full space-y-1.5 group">
			<label className="text-sm font-semibold text-taysir-teal transition-colors group-focus-within:text-taysir-light">
				{label}
			</label>
			<textarea
				className={clsx(
					"block w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 transition-all outline-none focus:ring-4",
					error
						? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/10"
						: "border-taysir-teal/15 focus:border-taysir-teal focus:ring-taysir-teal/10",
					className,
				)}
				rows={3}
				{...(props as any)}
			/>
			{error && (
				<p className="text-xs font-medium text-rose-600 mt-1">{error}</p>
			)}
		</div>
	);
}
