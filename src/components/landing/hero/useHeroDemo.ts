"use client";

import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	CLICK_PHASES,
	CURSOR,
	type Phase,
	type RowStatus,
	STUDENTS,
	TIMELINE,
} from "./demo-data";

/* ==========================================================================
   useHeroDemo — the state machine behind the live hero demo.
   The scripted ghost cursor performs the workflow; the same actions are wired
   to the real chips / buttons so a visitor can drive it too. Hovering pauses
   the script ("à vous de jouer"). All motion gated behind reduced-motion.
   ========================================================================== */

export function useHeroDemo() {
	// Garde anti-mismatch d'hydratation : `useReducedMotion` peut renvoyer une
	// valeur différente côté serveur (null/false) et côté client (matchMedia),
	// ce qui ferait diverger la structure du DOM (le curseur fantôme est rendu
	// conditionnellement sur `reduced`). On force `reduced=false` au premier
	// rendu (serveur == hydratation), puis on applique la vraie valeur après le
	// montage.
	const rawReduced = useReducedMotion();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const reduced = mounted ? (rawReduced ?? false) : false;

	const [step, setStep] = useState(0);
	const [paused, setPaused] = useState(false);

	const [filter, setFilter] = useState<"all" | "unpaid">("all");
	const [statuses, setStatuses] = useState<Record<string, RowStatus>>(() =>
		Object.fromEntries(STUDENTS.map((s) => [s.id, s.initialStatus])),
	);
	const [modalFor, setModalFor] = useState<string | null>(null);
	const [toast, setToast] = useState<{ name: string; amount: number } | null>(
		null,
	);
	const [waMsg, setWaMsg] = useState<{ name: string; amount: number } | null>(
		null,
	);
	const [waReply, setWaReply] = useState(false);
	const userDrivingRef = useRef(false);

	const phase: Phase = reduced ? "settle" : (TIMELINE[step]?.phase ?? "idle");

	/* Shared actions — script and visitor both call these */
	const encaisser = useCallback((id: string) => setModalFor(id), []);
	const confirmer = useCallback(() => {
		setModalFor((id) => {
			if (!id) return null;
			const s = STUDENTS.find((x) => x.id === id);
			if (s) {
				setStatuses((prev) => ({ ...prev, [id]: "justPaid" }));
				setToast({ name: s.name, amount: s.due });
			}
			return null;
		});
	}, []);
	const relancer = useCallback((id: string) => {
		const s = STUDENTS.find((x) => x.id === id);
		if (!s) return;
		setStatuses((prev) => ({ ...prev, [id]: "relanced" }));
		setWaMsg({ name: s.name, amount: s.due });
	}, []);
	const resetAll = useCallback(() => {
		setFilter("all");
		setStatuses(
			Object.fromEntries(STUDENTS.map((s) => [s.id, s.initialStatus])),
		);
		setModalFor(null);
		setToast(null);
		setWaMsg(null);
		setWaReply(false);
	}, []);

	/* The parent answers ~1.6s after the relance lands */
	useEffect(() => {
		if (!waMsg) return;
		const t = setTimeout(() => setWaReply(true), 1600);
		return () => clearTimeout(t);
	}, [waMsg]);

	/* Script driver */
	useEffect(() => {
		if (reduced || paused) return;
		const { phase: p, ms } = TIMELINE[step] ?? {
			phase: "idle" as Phase,
			ms: 1000,
		};
		if (!userDrivingRef.current) {
			if (p === "clickFilter") setFilter("unpaid");
			if (p === "clickEncaisser") encaisser("amina");
			if (p === "clickConfirm") confirmer();
			if (p === "clickRelance") relancer("yacine");
			if (p === "settle") setToast(null);
			if (p === "reset") resetAll();
		}
		const t = setTimeout(() => {
			if (step === TIMELINE.length - 1) userDrivingRef.current = false;
			setStep((i) => (i + 1) % TIMELINE.length);
		}, ms);
		return () => clearTimeout(t);
	}, [step, paused, reduced, encaisser, confirmer, relancer, resetAll]);

	/* When the visitor takes over, the ghost steps back for the full loop */
	const userAct = useCallback((fn: () => void) => {
		userDrivingRef.current = true;
		fn();
	}, []);

	const onHoverStart = useCallback(() => setPaused(true), []);
	const onHoverEnd = useCallback(() => {
		setPaused(false);
		userDrivingRef.current = false;
	}, []);

	/* Derived KPIs */
	const justPaidSum = STUDENTS.filter(
		(s) => statuses[s.id] === "justPaid",
	).reduce((a, s) => a + s.due, 0);
	const unpaidNow = STUDENTS.filter(
		(s) => statuses[s.id] === "unpaid" || statuses[s.id] === "relanced",
	);
	const collected = 184500 + justPaidSum;
	const rate = Math.round(87 + (justPaidSum > 0 ? 4 : 0));
	const outstanding = unpaidNow.reduce((a, s) => a + s.due, 0);
	const visibleRows = STUDENTS.filter((s) =>
		filter === "all"
			? true
			: statuses[s.id] === "unpaid" ||
				statuses[s.id] === "relanced" ||
				statuses[s.id] === "justPaid",
	);

	return {
		reduced,
		paused,
		phase,
		clicking: CLICK_PHASES.includes(phase),
		cursor: CURSOR[phase],
		filter,
		setFilter,
		statuses,
		modalFor,
		toast,
		waMsg,
		waReply,
		encaisser,
		confirmer,
		relancer,
		userAct,
		onHoverStart,
		onHoverEnd,
		collected,
		rate,
		outstanding,
		unpaidNow,
		visibleRows,
	};
}
