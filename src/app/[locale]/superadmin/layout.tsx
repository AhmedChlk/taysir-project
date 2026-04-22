"use client";

import { useState } from "react";
import Sidebar from "@/components/navigation/Sidebar";
import { Menu, Bell, Search, Shield } from "lucide-react";

export default function SuperAdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div className="flex h-screen bg-surface-50 overflow-hidden font-sans antialiased">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
				{/* Topbar */}
				<header className="h-20 bg-white border-b border-line flex items-center justify-between px-4 md:px-8 shrink-0 z-30 sticky top-0">
					<div className="flex items-center gap-4">
						<button
							type="button"
							className="p-2.5 hover:bg-surface-50 rounded-2xl md:hidden text-ink-500 transition-colors"
							onClick={() => setSidebarOpen(true)}
						>
							<Menu size={24} />
						</button>
						<div className="hidden md:flex items-center gap-3 px-4 py-2 bg-surface-50 rounded-xl border border-line w-96 group focus-within:ring-4 focus-within:ring-brand-500/10 transition-all">
							<Search size={18} className="text-ink-400 group-focus-within:text-brand-500" />
							<input
								type="text"
								placeholder="Rechercher un établissement..."
								className="bg-transparent border-none outline-none text-sm w-full text-ink-900 placeholder:text-ink-400 font-medium"
							/>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-danger rounded-full border border-rose-100 text-[10px] font-bold uppercase tracking-wider">
							<Shield size={12} strokeWidth={2.5} />
							Super Admin
						</div>
						<button type="button" className="relative p-2.5 hover:bg-surface-50 rounded-xl text-ink-400 transition-all group">
							<Bell size={20} className="group-hover:text-brand-500 transition-colors" />
							<span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-white shadow-sm" />
						</button>
					</div>
				</header>

				<main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
					<div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
