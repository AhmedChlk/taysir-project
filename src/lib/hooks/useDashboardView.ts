"use client";

import { useOptimistic, useState, useTransition } from "react";

export type DashboardAction<T> =
	| { type: "delete"; id: string }
	| { type: "create"; item: T }
	| { type: "update"; item: T };

export function useDashboardView<T extends { id: string }>(initialItems: T[]) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [selectedItem, setSelectedItem] = useState<T | null>(null);
	const [isPending, startTransition] = useTransition();

	const [optimisticItems, applyOptimistic] = useOptimistic(
		initialItems,
		(state: T[], action: DashboardAction<T>) => {
			switch (action.type) {
				case "delete":
					return state.filter((s) => s.id !== action.id);
				case "create":
					return [...state, action.item];
				case "update":
					return state.map((s) => (s.id === action.item.id ? action.item : s));
				default:
					return state;
			}
		},
	);

	const handleOpenCreate = () => {
		setSelectedItem(null);
		setErrorMessage(null);
		setIsModalOpen(true);
	};

	const handleOpenEdit = (item: T) => {
		setSelectedItem(item);
		setErrorMessage(null);
		setIsModalOpen(true);
	};

	const handleOpenDelete = (id: string) => {
		setItemToDelete(id);
		setIsDeleteModalOpen(true);
	};

	return {
		isModalOpen,
		setIsModalOpen,
		isDeleteModalOpen,
		setIsDeleteModalOpen,
		itemToDelete,
		setItemToDelete,
		errorMessage,
		setErrorMessage,
		selectedItem,
		setSelectedItem,
		isPending,
		startTransition,
		optimisticItems,
		applyOptimistic,
		handleOpenCreate,
		handleOpenEdit,
		handleOpenDelete,
	};
}
