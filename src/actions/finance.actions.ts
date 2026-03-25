// Gestion des paiements et de la finance

"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { PaymentMethod, Tranche, Paiement, PaymentPlan, Prisma } from "@prisma/client";
import { RegisterPaymentSchema } from "@/lib/validations";

// Types pour les tranches
type TrancheWithPaiements = Tranche & { 
  paiements: Paiement[], 
  paymentPlan?: PaymentPlan 
};

// Action pour enregistrer un nouveau paiement
export const registerPaymentAction = createSafeAction(
  RegisterPaymentSchema,
  async (data, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);

    // Note: Cast 'as any' nécessaire car les types d'extensions Prisma 
    // masquent parfois la signature de $transaction dans l'IDE.
    return await (tenantPrisma as any).$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Validation de la tranche (Isolation automatique)
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
      validatePaymentAmount(tranche, data.montant_paye);

      // 3. Exécution du workflow (Ecritures comptables)
      return await executeFinancialWorkflow(tx, tranche, data);
    });
  }
);

// Vérification que le montant n'est pas trop élevé
function validatePaymentAmount(tranche: TrancheWithPaiements, montantPaye: number) {
  const totalDejaPaye = tranche.paiements.reduce((sum, p) => sum + p.amount, 0);
  const resteAPayer = tranche.amount - totalDejaPaye;

  if (montantPaye > resteAPayer + 0.01) {
    throw new TaysirError(
      `Le montant dépasse le solde de la tranche (${resteAPayer} DZD restants).`,
      ErrorCodes.ERR_INVALID_DATA,
      400
    );
  }
}

// Mise à jour des statuts après paiement
async function executeFinancialWorkflow(
  tx: Prisma.TransactionClient, 
  tranche: TrancheWithPaiements, 
  data: z.infer<typeof RegisterPaymentSchema>
) {
  // Création du paiement (etablissementId injecté par l'extension)
  const paiement = await tx.paiement.create({
    data: {
      amount: data.montant_paye,
      method: data.methode,
      reference: data.reference,
      note: data.note,
      trancheId: tranche.id,
    } as any,
  });

  // Calcul du nouveau statut de la tranche
  const dejaPaye = tranche.paiements.reduce((sum, p) => sum + p.amount, 0) + data.montant_paye;
  const isTrancheFullPaid = dejaPaye >= tranche.amount - 0.01;

  if (isTrancheFullPaid) {
    await tx.tranche.update({
      where: { id: tranche.id },
      data: { isPaid: true },
    });
  }

  // Mise à jour du plan global
  const updatedPlan = await tx.paymentPlan.update({
    where: { id: tranche.paymentPlanId },
    data: { paidAmount: { increment: data.montant_paye } },
  });

  // Recalcul du statut du plan global
  const isPlanFullPaid = updatedPlan.paidAmount >= updatedPlan.totalAmount - 0.01;
  await tx.paymentPlan.update({
    where: { id: tranche.paymentPlanId },
    data: { status: isPlanFullPaid ? "PAID" : "PARTIAL" },
  });

  return {
    paiement,
    trancheStatut: isTrancheFullPaid ? "PAID" : "PARTIAL",
    resteSurTranche: Math.max(0, tranche.amount - dejaPaye),
  };
}
