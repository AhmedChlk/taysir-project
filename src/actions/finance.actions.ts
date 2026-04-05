// Gestion des paiements et de la finance

"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { PaymentMethod, Tranche, Paiement, PaymentPlan, Prisma } from "@prisma/client";
import { RegisterPaymentSchema, CreatePaymentPlanSchema } from "@/lib/validations";
import { revalidateTag } from "next/cache";

// Types pour les tranches
type TrancheWithPaiements = Tranche & { 
  paiements: Paiement[], 
  paymentPlan?: PaymentPlan 
};

// Action pour créer un plan de paiement avec des tranches
export const createPaymentPlanAction = createSafeAction(
  CreatePaymentPlanSchema,
  async (data, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    
    const result = await tenantPrisma.paymentPlan.create({
      data: {
        studentId: data.studentId,
        totalAmount: data.totalAmount,
        currency: data.currency,
        etablissementId: tenantId,
        tranches: {
          create: data.tranches.map(t => ({
            amount: t.amount,
            dueDate: new Date(t.dueDate),
            etablissementId: tenantId
          }))
        }
      } as any,
    });

    revalidateTag(`finance-${tenantId}`, "max");
    return result;
  }
);

// Action pour enregistrer un nouveau paiement
export const registerPaymentAction = createSafeAction(
  RegisterPaymentSchema,
  async (data, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);

    const result = await (tenantPrisma as any).$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Validation de la tranche
      const tranche = await tx.tranche.findUnique({
        where: { id: data.trancheId },
        include: { paiements: true, paymentPlan: true },
      }) as TrancheWithPaiements | null;

      if (!tranche) {
        throw new TaysirError("Tranche introuvable ou accès refusé.", ErrorCodes.ERR_NOT_FOUND, 404);
      }

      if (tranche.isPaid) {
        throw new TaysirError("Tranche déjà soldée.", ErrorCodes.ERR_INVALID_DATA, 400);
      }

      // 2. Calcul et validation métier
      const totalDejaPaye = tranche.paiements.reduce((sum, p) => sum + p.amount, 0);
      const resteAPayer = tranche.amount - totalDejaPaye;

      if (data.montant_paye > resteAPayer + 0.01) {
        throw new TaysirError(
          `Le montant dépasse le solde de la tranche (${resteAPayer} DZD restants).`,
          ErrorCodes.ERR_INVALID_DATA,
          400
        );
      }

      // 3. Exécution du workflow
      // Création du paiement
      const paiement = await tx.paiement.create({
        data: {
          amount: data.montant_paye,
          method: data.methode,
          reference: data.reference,
          note: data.note,
          trancheId: tranche.id,
          etablissementId: tenantId
        } as any,
      });

      // Calcul du nouveau statut de la tranche
      const dejaPaye = totalDejaPaye + data.montant_paye;
      const isTrancheFullPaid = dejaPaye >= tranche.amount - 0.01;

      if (isTrancheFullPaid) {
        await tx.tranche.update({
          where: { id: tranche.id, etablissementId: tenantId },
          data: { isPaid: true, etablissementId: tenantId },
        });
      }

      // Mise à jour du plan global
      const updatedPlan = await tx.paymentPlan.update({
        where: { id: tranche.paymentPlanId, etablissementId: tenantId },
        data: { 
          paidAmount: { increment: data.montant_paye },
          etablissementId: tenantId
        },
      });

      // Recalcul du statut du plan global
      const isPlanFullPaid = updatedPlan.paidAmount >= updatedPlan.totalAmount - 0.01;
      await tx.paymentPlan.update({
        where: { id: tranche.paymentPlanId, etablissementId: tenantId },
        data: { 
          status: isPlanFullPaid ? "PAID" : "PARTIAL",
          etablissementId: tenantId
        },
      });

      return {
        paiement,
        trancheStatut: isTrancheFullPaid ? "PAID" : "PARTIAL",
        resteSurTranche: Math.max(0, tranche.amount - dejaPaye),
      };
    });

    revalidateTag(`finance-${tenantId}`, "max");
    return result;
  }
);
