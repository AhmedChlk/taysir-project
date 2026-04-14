"use client";

import Modal from "./Modal";
import { SubmitButton } from "./SubmitButton";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "primary",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <SubmitButton
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            className={
              variant === "danger"
                ? "flex-1 sm:flex-none btn-danger !bg-red-600 !hover:bg-red-700 !text-white"
                : "flex-1 sm:flex-none btn-primary"
            }
          >
            {confirmLabel}
          </SubmitButton>
        </div>
      }
    >
      <p className="text-gray-600">{message}</p>
    </Modal>
  );
}
