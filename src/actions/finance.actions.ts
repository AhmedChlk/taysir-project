"use server";

import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { Tranche, Paiement, PaymentPlan, Prisma } from "@prisma/client";
import { RegisterPaymentSchema, CreatePaymentPlanSchema } from "@/lib/validations";
import { revalidateTag } from "next/cache";
import { jsPDF } from "jspdf";
import { put } from "@vercel/blob";

type TrancheWithPaiements = Tranche & { 
  paiements: Paiement[], 
  paymentPlan?: PaymentPlan 
};

export const createPaymentPlanAction = createSafeAction(
  CreatePaymentPlanSchema,
  async (data, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    
    let tranchesToCreate: { amount: number; dueDate: Date; etablissementId: string }[] = [];
    let calculatedTotalAmount = data.totalAmount || 0;

    if (data.tranches) {
      tranchesToCreate = data.tranches.map(t => ({
        amount: t.amount,
        dueDate: new Date(t.dueDate),
        etablissementId: tenantId
      }));

      const sumTranches = tranchesToCreate.reduce((sum, t) => sum + t.amount, 0);

      if (calculatedTotalAmount && Math.abs(calculatedTotalAmount - sumTranches) > 0.01) {
        throw new TaysirError(
          "Le montant total doit être exactement égal à la somme des tranches.",
          ErrorCodes.ERR_INVALID_DATA,
          400
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
          create: tranchesToCreate
        }
      },
    });

    revalidateTag(`finance-${tenantId}`, "max");
    return result;
  }
);

export const registerPaymentAction = createSafeAction(
  RegisterPaymentSchema,
  async (data, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);

    const transactionResult = await (tenantPrisma as any).$transaction(async (tx: Prisma.TransactionClient) => {
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

      const totalDejaPaye = tranche.paiements.reduce((sum, p) => sum + p.amount, 0);
      const resteAPayer = tranche.amount - totalDejaPaye;

      if (data.montant_paye > resteAPayer + 0.01) {
        throw new TaysirError(
          `Le montant dépasse le solde de la tranche (${resteAPayer} DZD restants).`,
          ErrorCodes.ERR_INVALID_DATA,
          400
        );
      }

      const paiement = await tx.paiement.create({
        data: {
          amount: data.montant_paye,
          method: data.methode,
          reference: data.reference,
          note: data.note,
          trancheId: tranche.id,
          etablissementId: tenantId
        },
      });

      const dejaPaye = totalDejaPaye + data.montant_paye;
      const isTrancheFullPaid = dejaPaye >= tranche.amount - 0.01;

      if (isTrancheFullPaid) {
        await tx.tranche.update({
          where: { id: tranche.id, etablissementId: tenantId },
          data: { isPaid: true },
        });
      }

      const updatedPlan = await tx.paymentPlan.update({
        where: { id: tranche.paymentPlanId, etablissementId: tenantId },
        data: { 
          paidAmount: { increment: data.montant_paye }
        },
      });

      const isPlanFullPaid = updatedPlan.paidAmount >= updatedPlan.totalAmount - 0.01;
      await tx.paymentPlan.update({
        where: { id: tranche.paymentPlanId, etablissementId: tenantId },
        data: { 
          status: isPlanFullPaid ? "PAID" : "PARTIAL"
        },
      });

      return {
        paiement,
        trancheStatut: isTrancheFullPaid ? "PAID" : "PARTIAL",
        resteSurTranche: Math.max(0, tranche.amount - dejaPaye),
      };
    });

    try {
      const paymentWithDetails = await tenantPrisma.paiement.findUnique({
        where: { id: transactionResult.paiement.id },
        include: {
          tranche: {
            include: {
              paymentPlan: {
                include: {
                  student: true,
                  etablissement: true
                }
              }
            }
          }
        }
      });

      if (paymentWithDetails) {
        const doc = new jsPDF();
        const school = paymentWithDetails.tranche.paymentPlan.etablissement;
        const student = paymentWithDetails.tranche.paymentPlan.student;

        doc.setFontSize(22);
        doc.setTextColor(15, 81, 92);
        doc.text(school.name, 105, 20, { align: "center" });
        doc.setDrawColor(15, 81, 92);
        doc.line(20, 25, 190, 25);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text("REÇU DE PAIEMENT", 105, 40, { align: "center" });
        
        doc.setFontSize(12);
        doc.text(`Reçu N° : ${paymentWithDetails.id.split('-')[0].toUpperCase()}`, 20, 60);
        doc.text(`Date : ${new Date(paymentWithDetails.date).toLocaleDateString('fr-FR')}`, 20, 70);
        
        doc.text(`Élève : ${student.firstName} ${student.lastName}`, 20, 90);
        doc.text(`Montant payé : ${paymentWithDetails.amount} DZD`, 20, 100);
        doc.text(`Méthode : ${paymentWithDetails.method}`, 20, 110);
        
        if (paymentWithDetails.reference) {
          doc.text(`Référence : ${paymentWithDetails.reference}`, 20, 120);
        }

        doc.text(`Reste à payer : ${transactionResult.resteSurTranche} DZD`, 20, 140);

        const pdfOutput = doc.output("arraybuffer");
        const { url } = await put(`receipts/${tenantId}/${paymentWithDetails.id}.pdf`, pdfOutput, {
          access: "public",
          contentType: "application/pdf",
        });

        await tenantPrisma.paiement.update({
          where: { id: paymentWithDetails.id },
          data: { receiptUrl: url }
        });

        transactionResult.paiement.receiptUrl = url;
      }
    } catch (e) {
      console.error("PDF generation failed", e);
    }

    revalidateTag(`finance-${tenantId}`, "max");
    return transactionResult;
  }
);
