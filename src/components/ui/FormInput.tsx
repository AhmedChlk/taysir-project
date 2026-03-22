"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";

interface BaseProps {
  label: string;
  error?: string;
  helperText?: string;
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, BaseProps {}

export function Input({ label, error, helperText, className, type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          className={clsx(
            "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2",
            error 
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
              : "border-gray-200 focus:border-accent-teal focus:ring-accent-teal/20",
            isPassword && "pe-10",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {(error || helperText) && (
        <p className={clsx("text-xs", error ? "text-red-500" : "text-gray-500")}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement>, BaseProps {
  options: { label: string; value: string | number }[];
}

export function Select({ label, error, helperText, options = [], className, ...props }: SelectProps) {
  return (
    <div className="w-full space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <select
        className={clsx(
          "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2",
          error 
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
            : "border-gray-200 focus:border-accent-teal focus:ring-accent-teal/20",
          className
        )}
        {...props}
      >
        {(options || []).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {(error || helperText) && (
        <p className={clsx("text-xs", error ? "text-red-500" : "text-gray-500")}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, BaseProps {}

export function TextArea({ label, error, helperText, className, ...props }: TextAreaProps) {
  return (
    <div className="w-full space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <textarea
        className={clsx(
          "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 transition-all focus:outline-none focus:ring-2",
          error 
            ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" 
            : "border-gray-200 focus:border-accent-teal focus:ring-accent-teal/20",
          className
        )}
        rows={3}
        {...props}
      />
      {(error || helperText) && (
        <p className={clsx("text-xs", error ? "text-red-500" : "text-gray-500")}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
