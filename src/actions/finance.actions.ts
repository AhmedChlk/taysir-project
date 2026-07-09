"use server";

import type { Paiement, PaymentPlan, Prisma, Tranche } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction, FRONTDESK_ROLES } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { money } from "@/lib/money";
import { getTenantPrisma } from "@/lib/prisma";
import {
	CreatePaymentPlanSchema,
	RegisterBulkPaymentSchema,
	RegisterPaymentSchema,
} from "@/lib/validations";

type TrancheWithPaiements = Tranche & {
	paiements: Paiement[];
	paymentPlan: PaymentPlan & {
		student: {
			firstName: string;
			lastName: string;
			parentPhone: string | null;
			phone: string | null;
		};
		etablissement: { name: string };
	};
};

export const createPaymentPlanAction = createSafeAction(
	CreatePaymentPlanSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		let tranchesToCreate: {
			amount: number;
			dueDate: Date;
			label: string | null;
			etablissementId: string;
		}[] = [];
		let calculatedTotalAmount = data.totalAmount || 0;

		if (data.tranches) {
			tranchesToCreate = data.tranches.map((t) => ({
				amount: t.amount,
				dueDate: new Date(t.dueDate),
				label: t.label ?? null,
				etablissementId: tenantId,
			}));

			const sumTranches = tranchesToCreate.reduce(
				(sum, t) => sum + t.amount,
				0,
			);

			if (
				calculatedTotalAmount &&
				Math.abs(calculatedTotalAmount - sumTranches) > 0.01
			) {
				throw new TaysirError(
					"Le montant total doit être exactement égal à la somme des tranches.",
					ErrorCodes.ERR_INVALID_DATA,
					400,
				);
			}

			if (!calculatedTotalAmount) {
				calculatedTotalAmount = sumTranches;
			}
		}

		const result = await tenantPrisma.paymentPlan.create({
			data: {
				studentId: data.studentId,
				activityId: data.activityId,
				totalAmount: calculatedTotalAmount,
				currency: data.currency,
				etablissementId: tenantId,
				tranches: {
					create: tranchesToCreate,
				},
			},
		});

		revalidateTag(`finance-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const registerPaymentAction = createSafeAction(
	RegisterPaymentSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const transactionResult = await tenantPrisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				// Verrouillage pessimiste pour éviter les race conditions sur le calcul
				// du solde. `Tranche.id` est une colonne `text` (String @id) : on
				// compare texte à texte, sans CAST uuid (qui échouerait : text = uuid).
				await tx.$executeRaw`SELECT 1 FROM "Tranche" WHERE id = ${data.trancheId} FOR UPDATE`;

				const tranche = (await tx.tranche.findUnique({
					where: {
						id_etablissementId: {
							id: data.trancheId,
							etablissementId: tenantId,
						},
					},
					include: {
						paiements: true,
						paymentPlan: {
							include: {
								student: {
									select: {
										firstName: true,
										lastName: true,
										parentPhone: true,
										phone: true,
									},
								},
								etablissement: { select: { name: true } },
							},
						},
					},
				})) as TrancheWithPaiements | null;

				if (!tranche) {
					throw new TaysirError(
						"Tranche introuvable ou accès refusé.",
						ErrorCodes.ERR_NOT_FOUND,
						404,
					);
				}

				if (tranche.isPaid) {
					throw new TaysirError(
						"Tranche déjà soldée.",
						ErrorCodes.ERR_INVALID_DATA,
						400,
					);
				}

				const totalDejaPaye = tranche.paiements.reduce(
					(sum, p) => sum + money(p.amount),
					0,
				);
				const trancheAmount = money(tranche.amount);
				const resteAPayer = trancheAmount - totalDejaPaye;

				if (data.montant_paye > resteAPayer + 0.01) {
					throw new TaysirError(
						`Le montant dépasse le solde de la tranche (${resteAPayer} DZD restants).`,
						ErrorCodes.ERR_INVALID_DATA,
						400,
					);
				}

				// Numéro de reçu séquentiel par établissement (fiscal / audit).
				// Calculé sous le verrou de la transaction pour éviter les doublons.
				const lastReceipt = await tx.paiement.findFirst({
					where: { etablissementId: tenantId },
					orderBy: { receiptNumber: "desc" },
					select: { receiptNumber: true },
				});
				const receiptNumber = (lastReceipt?.receiptNumber ?? 0) + 1;

				const paiement = await tx.paiement.create({
					data: {
						amount: data.montant_paye,
						method: data.methode,
						receiptNumber,
						reference: data.reference ?? null,
						note: data.note ?? null,
						trancheId: tranche.id,
						etablissementId: tenantId,
					},
				});

				const dejaPaye = totalDejaPaye + data.montant_paye;
				const isTrancheFullPaid = dejaPaye >= trancheAmount - 0.01;

				if (isTrancheFullPaid) {
					await tx.tranche.update({
						where: {
							id_etablissementId: {
								id: tranche.id,
								etablissementId: tenantId,
							},
						},
						data: { isPaid: true },
					});
				}

				const updatedPlan = await tx.paymentPlan.update({
					where: {
						id_etablissementId: {
							id: tranche.paymentPlanId,
							etablissementId: tenantId,
						},
					},
					data: {
						paidAmount: { increment: data.montant_paye },
					},
				});

				const isPlanFullPaid =
					money(updatedPlan.paidAmount) >=
					money(updatedPlan.totalAmount) - 0.01;
				await tx.paymentPlan.update({
					where: {
						id_etablissementId: {
							id: tranche.paymentPlanId,
							etablissementId: tenantId,
						},
					},
					data: {
						status: isPlanFullPaid ? "PAID" : "PARTIAL",
					},
				});

				const resteSurPlan = Math.max(
					0,
					money(updatedPlan.totalAmount) - money(updatedPlan.paidAmount),
				);
				const st = tranche.paymentPlan.student;

				return {
					paiementId: paiement.id,
					trancheStatut: isTrancheFullPaid ? "PAID" : "PARTIAL",
					planStatut: isPlanFullPaid ? "PAID" : "PARTIAL",
					resteSurTranche: Math.max(0, trancheAmount - dejaPaye),
					resteSurPlan,
					// Données pour l'envoi automatique du reçu par WhatsApp au parent.
					receipt: {
						receiptNumber,
						amount: data.montant_paye,
						studentFirstName: st.firstName,
						studentLastName: st.lastName,
						parentPhone: st.parentPhone || st.phone || null,
						schoolName: tranche.paymentPlan.etablissement.name,
						remaining: resteSurPlan,
					},
				};
			},
		);

		revalidateTag(`finance-${tenantId}`, "max");
		return transactionResult;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

/**
 * Règlement global : répartit un montant unique sur les échéances impayées les
 * plus anciennes d'un plan (paie plusieurs tranches en retard en une seule
 * opération). Chaque tranche couverte reçoit son propre paiement + numéro de
 * reçu séquentiel ; la dernière tranche peut être partielle.
 */
export const registerBulkPaymentAction = createSafeAction(
	RegisterBulkPaymentSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const result = await tenantPrisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				// Verrou pessimiste sur toutes les tranches du plan.
				await tx.$executeRaw`SELECT 1 FROM "Tranche" WHERE "paymentPlanId" = ${data.paymentPlanId} FOR UPDATE`;

				const plan = await tx.paymentPlan.findUnique({
					where: {
						id_etablissementId: {
							id: data.paymentPlanId,
							etablissementId: tenantId,
						},
					},
					include: {
						student: {
							select: {
								firstName: true,
								lastName: true,
								parentPhone: true,
								phone: true,
							},
						},
						etablissement: { select: { name: true } },
						tranches: {
							where: { isPaid: false },
							orderBy: { dueDate: "asc" },
							include: { paiements: true },
						},
					},
				});

				if (!plan) {
					throw new TaysirError(
						"Plan de paiement introuvable ou accès refusé.",
						ErrorCodes.ERR_NOT_FOUND,
						404,
					);
				}

				// Reste dû par tranche impayée (montant − déjà versé), ancien d'abord.
				const unpaid = plan.tranches
					.map((tr) => {
						const paid = tr.paiements.reduce((s, p) => s + money(p.amount), 0);
						return { id: tr.id, reste: money(tr.amount) - paid };
					})
					.filter((t) => t.reste > 0.01);

				const totalReste = unpaid.reduce((s, t) => s + t.reste, 0);
				if (unpaid.length === 0) {
					throw new TaysirError(
						"Aucune échéance impayée sur ce plan.",
						ErrorCodes.ERR_INVALID_DATA,
						400,
					);
				}
				if (data.montant_paye > totalReste + 0.01) {
					throw new TaysirError(
						`Le montant dépasse le solde du plan (${totalReste} DZD restants).`,
						ErrorCodes.ERR_INVALID_DATA,
						400,
					);
				}

				let remaining = data.montant_paye;
				let lastReceiptNumber =
					(
						await tx.paiement.findFirst({
							where: { etablissementId: tenantId },
							orderBy: { receiptNumber: "desc" },
							select: { receiptNumber: true },
						})
					)?.receiptNumber ?? 0;
				const firstReceiptNumber = lastReceiptNumber + 1;
				let paidTranchesCount = 0;

				for (const t of unpaid) {
					if (remaining <= 0.01) break;
					const alloc = Math.min(t.reste, remaining);
					lastReceiptNumber += 1;
					await tx.paiement.create({
						data: {
							amount: alloc,
							method: data.methode,
							receiptNumber: lastReceiptNumber,
							reference: data.reference ?? null,
							note: data.note ?? null,
							trancheId: t.id,
							etablissementId: tenantId,
						},
					});
					// Tranche entièrement couverte → soldée.
					if (alloc >= t.reste - 0.01) {
						await tx.tranche.update({
							where: {
								id_etablissementId: { id: t.id, etablissementId: tenantId },
							},
							data: { isPaid: true },
						});
						paidTranchesCount += 1;
					}
					remaining -= alloc;
				}

				const updatedPlan = await tx.paymentPlan.update({
					where: {
						id_etablissementId: {
							id: data.paymentPlanId,
							etablissementId: tenantId,
						},
					},
					data: { paidAmount: { increment: data.montant_paye } },
				});

				const isPlanFullPaid =
					money(updatedPlan.paidAmount) >=
					money(updatedPlan.totalAmount) - 0.01;
				await tx.paymentPlan.update({
					where: {
						id_etablissementId: {
							id: data.paymentPlanId,
							etablissementId: tenantId,
						},
					},
					data: { status: isPlanFullPaid ? "PAID" : "PARTIAL" },
				});

				const resteSurPlan = Math.max(
					0,
					money(updatedPlan.totalAmount) - money(updatedPlan.paidAmount),
				);
				const st = plan.student;

				return {
					tranchesPayees: paidTranchesCount,
					planStatut: isPlanFullPaid ? "PAID" : "PARTIAL",
					resteSurPlan,
					// Reçu WhatsApp global au parent (un seul message pour le lot).
					receipt: {
						receiptNumber: firstReceiptNumber,
						amount: data.montant_paye,
						studentFirstName: st.firstName,
						studentLastName: st.lastName,
						parentPhone: st.parentPhone || st.phone || null,
						schoolName: plan.etablissement.name,
						remaining: resteSurPlan,
					},
				};
			},
		);

		revalidateTag(`finance-${tenantId}`, "max");
		return result;
	},
	{ requiredRole: FRONTDESK_ROLES },
);

export const getPaymentReceiptDataAction = createSafeAction(
	z.object({ paiementId: z.string().uuid() }),
	async ({ paiementId }, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const payment = await tenantPrisma.paiement.findUnique({
			where: {
				id_etablissementId: { id: paiementId, etablissementId: tenantId },
			},
			include: {
				tranche: {
					include: {
						paiements: true,
						paymentPlan: {
							include: {
								student: { select: { firstName: true, lastName: true } },
								etablissement: { select: { name: true } },
							},
						},
					},
				},
			},
		});

		if (!payment) {
			throw new TaysirError(
				"Paiement introuvable.",
				ErrorCodes.ERR_NOT_FOUND,
				404,
			);
		}

		const totalDejaPaye = payment.tranche.paiements.reduce(
			(sum, p) => sum + money(p.amount),
			0,
		);
		const resteSurTranche = Math.max(
			0,
			money(payment.tranche.amount) - totalDejaPaye,
		);

		return {
			paiementId: payment.id,
			receiptNumber: payment.receiptNumber,
			paiementDate: payment.date,
			amount: money(payment.amount),
			method: payment.method,
			reference: payment.reference,
			resteSurTranche,
			studentFirstName: payment.tranche.paymentPlan.student.firstName,
			studentLastName: payment.tranche.paymentPlan.student.lastName,
			schoolName: payment.tranche.paymentPlan.etablissement.name,
		};
	},
	{ requiredRole: FRONTDESK_ROLES },
);
