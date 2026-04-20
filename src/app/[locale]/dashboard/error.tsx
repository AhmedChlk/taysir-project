"use client";

import { useEffect } from "react";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
	useEffect(() => {
		console.error("[DASHBOARD_ERROR]", error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
			<div className="text-center">
				<h2 className="text-xl font-semibold text-gray-800 mb-2">
					Une erreur est survenue
				</h2>
				<p className="text-gray-500 text-sm mb-6">
					{error.message || "Erreur inattendue. Veuillez réessayer."}
				</p>
				<button
					onClick={reset}
					className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
				>
					Réessayer
				</button>
			</div>
		</div>
	);
}
