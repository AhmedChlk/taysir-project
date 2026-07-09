/* ==========================================================================
   loadImageAsDataUrl — client-only. Loads a same-origin image and returns a
   JPEG data URL (for jsPDF.addImage). Resolves null on any failure so callers
   degrade gracefully (PDF falls back to an initials disc).
   ========================================================================== */

export function loadImageAsDataUrl(
	url: string,
	maxSize = 256,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
	return new Promise((resolve) => {
		if (typeof window === "undefined") {
			resolve(null);
			return;
		}
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			try {
				const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
				const w = Math.round(img.width * scale);
				const h = Math.round(img.height * scale);
				const canvas = document.createElement("canvas");
				canvas.width = w;
				canvas.height = h;
				const ctx = canvas.getContext("2d");
				if (!ctx) {
					resolve(null);
					return;
				}
				ctx.drawImage(img, 0, 0, w, h);
				resolve({
					dataUrl: canvas.toDataURL("image/jpeg", 0.85),
					width: w,
					height: h,
				});
			} catch {
				resolve(null);
			}
		};
		img.onerror = () => resolve(null);
		img.src = url;
	});
}
