"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getEtablissementId() {
  const etablissement = await prisma.etablissement.findFirst();
  if (!etablissement) throw new Error("Établissement introuvable");
  return etablissement.id;
}

function purify(data: any) {
  return JSON.parse(JSON.stringify(data));
}

export async function createPaymentAction(data: any) {
  try {
    const tid = await getEtablissementId();
    
    if (!data.studentId) {
      return { success: false, error: { message: "L'ID de l'élève est obligatoire." } };
    }

    // On s'assure que les nombres sont bien des "Float" pour Prisma
    const total = parseFloat(data.amount) || 0;
    const paid = parseFloat(data.paidAmount) || total;

    // Détermination du statut compatible avec ton schéma
    let status = "PENDING";
    if (paid >= total && total > 0) status = "PAID";
    else if (paid > 0) status = "PARTIAL";

    const result = await prisma.paymentPlan.create({
      data: {
        totalAmount: total,
        paidAmount: paid,
        status: status,
        currency: "DZD", // Souvent obligatoire dans ton schéma
        // On ajoute la méthode de paiement (CASH par défaut)
        // car elle est souvent obligatoire dans les modèles financiers
        method: data.method || "CASH", 

        etablissement: { connect: { id: tid } },
        student: { connect: { id: data.studentId } }
      },
    });

    revalidatePath("/dashboard/payments");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    console.error("Erreur Prisma détaillée:", error);
    // On renvoie l'erreur brute pour comprendre quel champ manque si ça rate encore
    return { success: false, error: { message: error.message } };
  }
}

export async function updatePaymentAction(data: any) {
  try {
    const { id, studentId, ...updateData } = data;
    
    const result = await prisma.paymentPlan.update({
      where: { id },
      data: {
        ...(updateData.amount && { 
          totalAmount: parseFloat(updateData.amount),
          paidAmount: parseFloat(updateData.amount)
        }),
        status: updateData.status,
        ...(studentId && { student: { connect: { id: studentId } } })
      },
    });

    revalidatePath("/dashboard/payments");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}

export async function deletePaymentAction({ id }: { id: string }) {
  try {
    await prisma.paymentPlan.delete({ where: { id } });
    revalidatePath("/dashboard/payments");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
}