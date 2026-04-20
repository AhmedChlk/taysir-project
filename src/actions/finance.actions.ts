"use server";

import type { Paiement, PaymentPlan, Prisma, Tranche } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma } from "@/lib/prisma";
import {
	CreatePaymentPlanSchema,
	RegisterPaymentSchema,
} from "@/lib/validations";

type TrancheWithPaiements = Tranche & {
	paiements: Paiement[];
	paymentPlan?: PaymentPlan;
};

export const createPaymentPlanAction = createSafeAction(
	CreatePaymentPlanSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		let tranchesToCreate: {
			amount: number;
			dueDate: Date;
			etablissementId: string;
		}[] = [];
		let calculatedTotalAmount = data.totalAmount || 0;

		if (data.tranches) {
			tranchesToCreate = data.tranches.map((t) => ({
				amount: t.amount,
				dueDate: new Date(t.dueDate),
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
);

export const registerPaymentAction = createSafeAction(
	RegisterPaymentSchema,
	async (data, { tenantId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);

		const transactionResult = await tenantPrisma.$transaction(
			async (tx: Prisma.TransactionClient) => {
				// Verrouillage pessimiste pour éviter les race conditions sur le calcul du solde
				// On utilise executeRaw car Prisma ne supporte pas encore nativement FOR UPDATE dans findUnique
				await tx.$executeRaw`SELECT 1 FROM "Tranche" WHERE id = CAST(${data.trancheId} AS uuid) FOR UPDATE`;

				const tranche = (await tx.tranche.findUnique({
					where: {
						id_etablissementId: {
							id: data.trancheId,
							etablissementId: tenantId,
						},
					},
					include: { paiements: true, paymentPlan: true },
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
					(sum, p) => sum + p.amount,
					0,
				);
				const resteAPayer = tranche.amount - totalDejaPaye;

				if (data.montant_paye > resteAPayer + 0.01) {
					throw new TaysirError(
						`Le montant dépasse le solde de la tranche (${resteAPayer} DZD restants).`,
						ErrorCodes.ERR_INVALID_DATA,
						400,
					);
				}

				const paiement = await tx.paiement.create({
					data: {
						amount: data.montant_paye,
						method: data.methode,
						reference: data.reference ?? null,
						note: data.note ?? null,
						trancheId: tranche.id,
						etablissementId: tenantId,
					},
				});

				const dejaPaye = totalDejaPaye + data.montant_paye;
				const isTrancheFullPaid = dejaPaye >= tranche.amount - 0.01;

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
					updatedPlan.paidAmount >= updatedPlan.totalAmount - 0.01;
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

				return {
					paiement,
					trancheStatut: isTrancheFullPaid ? "PAID" : "PARTIAL",
					resteSurTranche: Math.max(0, tranche.amount - dejaPaye),
				};
			},
		);

		revalidateTag(`finance-${tenantId}`, "max");
		return transactionResult;
	},
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
			(sum, p) => sum + p.amount,
			0,
		);
		const resteSurTranche = Math.max(0, payment.tranche.amount - totalDejaPaye);

		return {
			paiementId: payment.id,
			paiementDate: payment.date,
			amount: payment.amount,
			method: payment.method,
			reference: payment.reference,
			resteSurTranche,
			studentFirstName: payment.tranche.paymentPlan.student.firstName,
			studentLastName: payment.tranche.paymentPlan.student.lastName,
			schoolName: payment.tranche.paymentPlan.etablissement.name,
		};
	},
);
