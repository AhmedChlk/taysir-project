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
		<div className="flex h-screen bg-gray-50 overflow-hidden font-inter">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			<div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
				{/* Topbar */}
				<header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0 z-30 sticky top-0">
					<div className="flex items-center gap-4">
						<button
							type="button"
							className="p-2.5 hover:bg-gray-50 rounded-2xl md:hidden text-gray-600 transition-colors"
							onClick={() => setSidebarOpen(true)}
						>
							<Menu size={24} />
						</button>
						<div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 w-96 group focus-within:ring-2 focus-within:ring-taysir-teal/20 transition-all">
							<Search size={18} className="text-gray-400 group-focus-within:text-taysir-teal" />
							<input
								type="text"
								placeholder="Rechercher un établissement..."
								className="bg-transparent border-none outline-none text-sm w-full text-gray-600 placeholder:text-gray-400"
							/>
						</div>
					</div>

					<div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-100 text-[10px] font-black uppercase tracking-wider">
                            <Shield size={12} strokeWidth={3} />
                            Super Admin
                        </div>
						<button type="button" className="p-2.5 hover:bg-gray-50 rounded-2xl text-gray-500 transition-colors relative">
							<Bell size={22} />
							<span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-taysir-accent rounded-full border-2 border-white shadow-sm" />
						</button>
					</div>
				</header>

				<main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
					<div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
