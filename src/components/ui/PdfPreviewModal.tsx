"use client";

import type { jsPDF } from "jspdf";
import { Download, Loader2, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/primitives";

/* ==========================================================================
   PdfPreviewModal — generic in-app PDF preview (iframe) + Download + Print.
   Caller supplies a `build` that returns a jsPDF doc (sync or async). Memoise
   `build` (useCallback) so the effect doesn't rebuild on every render.
   ========================================================================== */
export function PdfPreviewModal({
	isOpen,
	onClose,
	title,
	fileName,
	build,
}: {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	fileName: string;
	build: () => Promise<jsPDF> | jsPDF;
}) {
	const [url, setUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const docRef = useRef<jsPDF | null>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		let cancelled = false;
		let blobUrl: string | null = null;

		(async () => {
			setLoading(true);
			const doc = await build();
			if (cancelled) return;
			docRef.current = doc;
			blobUrl = String(doc.output("bloburl"));
			setUrl(blobUrl);
			setLoading(false);
		})();

		return () => {
			cancelled = true;
			if (blobUrl) URL.revokeObjectURL(blobUrl);
			setUrl(null);
		};
	}, [isOpen, build]);

	const handleDownload = () => docRef.current?.save(fileName);
	const handlePrint = () => iframeRef.current?.contentWindow?.print();

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			size="full"
			footer={
				<>
					<Button
						variant="secondary"
						icon={<Printer size={16} />}
						onClick={handlePrint}
						disabled={!url}
					>
						Imprimer
					</Button>
					<Button
						icon={<Download size={16} />}
						onClick={handleDownload}
						disabled={!url}
					>
						Télécharger le PDF
					</Button>
				</>
			}
		>
			{loading || !url ? (
				<div className="flex h-[70vh] items-center justify-center text-ink-400">
					<Loader2 size={28} className="animate-spin text-brand-500" />
				</div>
			) : (
				<iframe
					ref={iframeRef}
					title="Aperçu du document PDF"
					src={url}
					className="h-[70vh] w-full rounded-xl border border-line/60 bg-surface-50"
				/>
			)}
		</Modal>
	);
}
