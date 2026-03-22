"use client";

import { clsx } from "clsx";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
  description?: string;
}

export function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-semibold text-gray-900">{label}</span>}
          {description && <span className="text-xs text-gray-500">{description}</span>}
        </div>
      )}
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2",
          enabled ? "bg-accent-teal" : "bg-gray-200"
        )}
      >
        <span
          aria-hidden="true"
          className={clsx(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}
