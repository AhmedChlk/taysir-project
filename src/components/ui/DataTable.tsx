"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, MoreVertical, Inbox } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from 'next-intl';
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
      // Prioritize search on keys defined in columns to be more efficient
      return columns.some(col => {
        if (typeof col.accessor === 'string') {
          const val = item[col.accessor];
          return val != null && val.toString().toLowerCase().includes(searchLower);
        }
        // Accessors as functions often return ReactNodes (icons, badges) which aren't directly searchable.
        // We fallback to a full object search if no match is found in string-based columns.
        return false;
      }) || 
      Object.values(item || {}).some(
        (val) => val != null && val.toString().toLowerCase().includes(searchLower)
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
        actionLabel={onAdd ? t("add") : undefined}
        onAction={onAdd}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md group">
          <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-accent-teal transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-11 pe-4 text-sm placeholder-gray-400 focus:border-accent-teal focus:outline-none focus:ring-4 focus:ring-accent-teal/5 transition-all shadow-sm"
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
            onClick={onAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-primary-teal px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-teal/20 hover:bg-accent-teal hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
          >
            {t("add")}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar rounded-2xl">
          <table className="w-full text-sm text-gray-600 border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={clsx(
                      "px-6 py-4 text-start text-[11px] font-bold uppercase tracking-wider text-gray-400",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
                {!hideDefaultAction && (
                  <th className="px-6 py-4 text-end text-[11px] font-bold uppercase tracking-wider text-gray-400">{t("actions")}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50/50 transition-all duration-200 relative">
                    {columns.map((col, idx) => (
                      <td
                        key={idx}
                        className={clsx("px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700", col.className)}
                      >
                        {typeof col.accessor === "function"
                          ? col.accessor(item)
                          : (item[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                    {!hideDefaultAction && (
                      <td className="px-6 py-4 text-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction ? onAction(item) : undefined;
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-accent-teal p-2 rounded-xl hover:bg-white shadow-none hover:shadow-sm border border-transparent hover:border-gray-100 transition-all duration-200"
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
                    className="px-6 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                       <Inbox size={40} className="text-gray-200" />
                       <p className="text-gray-400 font-medium">{t("no_results")}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-50 bg-white px-6 py-5 gap-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {t("pagination_showing")} <span className="text-gray-900">{startIndex + 1}</span> {t("pagination_to")}{" "}
              <span className="text-gray-900">
                {Math.min(startIndex + pageSize, filteredData.length)}
              </span>{" "}
              {t("pagination_of")} <span className="text-gray-900">{filteredData.length}</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rtl:rotate-180"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={clsx(
                      "h-9 w-9 rounded-xl text-sm font-bold transition-all",
                      currentPage === page
                        ? "bg-primary-teal text-white shadow-lg shadow-primary-teal/20 scale-110"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all rtl:rotate-180"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
