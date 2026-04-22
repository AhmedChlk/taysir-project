"use client";

import { clsx } from "clsx";
import {
	ChevronLeft,
	ChevronRight,
	Inbox,
	MoreVertical,
	Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import EmptyState from "./EmptyState";

interface Column<T> {
	header: string;
	accessor: keyof T | ((item: T) => React.ReactNode);
	className?: string;
}

interface DataTableProps<T> {
	data: T[];
	columns: Column<T>[];
	searchPlaceholder?: string;
	pageSize?: number;
	onAction?: (item: T) => void;
	hideDefaultAction?: boolean;
	emptyTitle?: string;
	emptyDescription?: string;
	onAdd?: () => void;
}

export default function DataTable<T extends { id: string | number }>({
	data = [],
	columns,
	searchPlaceholder,
	pageSize = 10,
	onAction,
	hideDefaultAction = false,
	emptyTitle,
	emptyDescription,
	onAdd,
}: DataTableProps<T>) {
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const t = useTranslations();

	const finalSearchPlaceholder = searchPlaceholder || t("search");

	const filteredData = useMemo(() => {
		if (!searchTerm) return data || [];

		const searchLower = searchTerm.toLowerCase();

		return (data || []).filter((item) => {
			return (
				columns.some((col) => {
					if (typeof col.accessor === "string") {
						const val = item[col.accessor];
						return val?.toString().toLowerCase().includes(searchLower);
					}
					return false;
				}) ||
				Object.values(item || {}).some((val) =>
					val?.toString().toLowerCase().includes(searchLower),
				)
			);
		});
	}, [data, searchTerm, columns]);

	const totalPages = Math.ceil(filteredData.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

	const goToPage = (page: number) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	if (!data || data.length === 0) {
		return (
			<EmptyState
				icon={Inbox}
				title={emptyTitle || t("no_results")}
				description={emptyDescription || t("empty_list_desc")}
				{...(onAdd ? { actionLabel: t("add"), onAction: onAdd } : {})}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-8 animate-in fade-in duration-500">
			<div className="flex flex-col sm:flex-row items-center justify-between gap-6">
				<div className="relative w-full sm:max-w-lg group">
					<div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
						<Search className="h-4 w-4 text-ink-400 group-focus-within:text-brand-500 transition-colors" />
					</div>
					<input
						type="text"
						className="block w-full rounded-2xl border border-line bg-white py-3 ps-12 pe-4 text-sm text-ink-900 placeholder-ink-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/5 transition-all shadow-sm"
						placeholder={finalSearchPlaceholder}
						value={searchTerm}
						onChange={(e) => {
							setSearchTerm(e.target.value);
							setCurrentPage(1);
						}}
					/>
				</div>

				{onAdd && (
					<button
						type="button"
						onClick={onAdd}
						className="btn btn--primary btn--md px-8 h-12 shadow-xl shadow-brand-500/10 active:scale-95"
					>
						{t("add")}
					</button>
				)}
			</div>

			<div className="bg-white rounded-[24px] border border-line shadow-sm overflow-hidden">
				<div className="overflow-x-auto custom-scrollbar">
					<table className="w-full text-sm text-ink-700 border-collapse">
						<thead>
							<tr className="bg-surface-50 border-b border-line">
								{columns.map((col, idx) => (
									<th
										key={idx}
										className={clsx(
											"px-8 py-5 text-start text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400",
											col.className,
										)}
									>
										{col.header}
									</th>
								))}
								{!hideDefaultAction && (
									<th className="px-8 py-5 text-end text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">
										{t("actions")}
									</th>
								)}
							</tr>
						</thead>
						<tbody className="divide-y divide-line">
							{paginatedData.length > 0 ? (
								paginatedData.map((item) => (
									<tr
										key={item.id}
										className="group hover:bg-surface-50/50 transition-all duration-200"
									>
										{columns.map((col, idx) => (
											<td
												key={idx}
												className={clsx(
													"px-8 py-5 whitespace-nowrap text-sm font-medium",
													col.className,
												)}
											>
												{typeof col.accessor === "function"
													? col.accessor(item)
													: (item[col.accessor] as React.ReactNode)}
											</td>
										))}
										{!hideDefaultAction && (
											<td className="px-8 py-5 text-end">
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														onAction ? onAction(item) : undefined;
													}}
													className="opacity-0 group-hover:opacity-100 text-ink-400 hover:text-brand-500 p-2 rounded-xl hover:bg-white shadow-none hover:shadow-sm border border-transparent hover:border-line transition-all duration-200"
												>
													<MoreVertical size={18} />
												</button>
											</td>
										)}
									</tr>
								))
							) : (
								<tr>
									<td
										colSpan={columns.length + 1}
										className="px-8 py-20 text-center"
									>
										<div className="flex flex-col items-center gap-4">
											<div className="w-16 h-16 rounded-full bg-surface-50 flex items-center justify-center text-ink-200">
												<Inbox size={32} strokeWidth={1.5} />
											</div>
											<p className="text-ink-400 font-bold uppercase tracking-widest text-[11px]">
												{t("no_results")}
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>

				{totalPages > 1 && (
					<div className="flex flex-col sm:flex-row items-center justify-between border-t border-line bg-white px-8 py-6 gap-4">
						<div className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">
							{t("pagination_showing")}{" "}
							<span className="text-ink-900">{startIndex + 1}</span>{" "}
							{t("pagination_to")}{" "}
							<span className="text-ink-900">
								{Math.min(startIndex + pageSize, filteredData.length)}
							</span>{" "}
							{t("pagination_of")}{" "}
							<span className="text-ink-900">{filteredData.length}</span>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => goToPage(currentPage - 1)}
								disabled={currentPage === 1}
								className="h-10 w-10 flex items-center justify-center rounded-xl border border-line text-ink-400 hover:bg-surface-50 hover:text-ink-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rtl:rotate-180"
							>
								<ChevronLeft size={20} />
							</button>

							<div className="flex items-center gap-1.5">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(page) => (
										<button
											key={page}
											type="button"
											onClick={() => goToPage(page)}
											className={clsx(
												"h-10 min-w-[40px] px-2 rounded-xl text-sm font-bold transition-all",
												currentPage === page
													? "bg-brand-500 text-white shadow-lg shadow-brand-500/20 scale-105"
													: "text-ink-500 hover:bg-surface-50 hover:text-ink-900",
											)}
										>
											{page}
										</button>
									),
								)}
							</div>

							<button
								type="button"
								onClick={() => goToPage(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="h-10 w-10 flex items-center justify-center rounded-xl border border-line text-ink-400 hover:bg-surface-50 hover:text-ink-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rtl:rotate-180"
							>
								<ChevronRight size={20} />
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
