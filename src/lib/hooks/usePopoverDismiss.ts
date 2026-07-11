"use client";

import { useEffect, useRef } from "react";

/* ==========================================================================
   usePopoverDismiss — a11y clavier partagée pour les popovers du topbar
   (cloche, menu compte, langue). Quand le popover est ouvert :
   - Escape le ferme ;
   - le focus qui était sur le trigger est mémorisé à l'ouverture puis RESTAURÉ
     sur le trigger à la fermeture (sinon il retombe sur <body>).
   Le déplacement du focus DANS le panneau est géré par l'appelant (il connaît
   son premier élément focusable).
   ========================================================================== */
export function usePopoverDismiss(isOpen: boolean, close: () => void) {
	const triggerRef = useRef<HTMLElement | null>(null);
	const wasOpen = useRef(false);

	useEffect(() => {
		// Capture le trigger uniquement sur la transition fermé → ouvert.
		if (isOpen && !wasOpen.current) {
			triggerRef.current = (document.activeElement as HTMLElement) ?? null;
		}
		const justClosed = wasOpen.current && !isOpen;
		wasOpen.current = isOpen;

		if (!isOpen) {
			if (justClosed && triggerRef.current) {
				triggerRef.current.focus?.();
			}
			triggerRef.current = null;
			return;
		}

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				close();
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [isOpen, close]);
}
