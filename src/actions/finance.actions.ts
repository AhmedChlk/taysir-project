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
    
    // --- DEBUG : Regarde ton terminal Codespaces après avoir cliqué sur Sauvegarder ---
    console.log("DONNÉES REÇUES PAR LE SERVEUR :", data);

    // 1. On s'assure que l'ID de l'élève est présent
    if (!data.studentId) throw new Error("ID de l'élève manquant");

    // 2. Conversion stricte en nombres (Prisma déteste les strings pour des montants)
    const total = parseFloat(data.amount) || 0;
    const paid = parseFloat(data.paidAmount) || 0;

    // 3. Logique de statut basée sur tes Enums probables (PAID, PARTIAL, PENDING)
    let finalStatus = "PENDING";
    if (paid >= total && total > 0) finalStatus = "PAID";
    else if (paid > 0) finalStatus = "PARTIAL";

    // 4. Création avec les champs EXACTS du schéma
    const result = await prisma.paymentPlan.create({
      data: {
        totalAmount: total,
        paidAmount: paid,
        currency: "DZD", // Champ obligatoire d'après ton erreur précédente
        status: finalStatus,
        
        // Relations
        etablissement: { connect: { id: tid } },
        student: { connect: { id: data.studentId } }
      },
    });

    console.log("✅ PAIEMENT CRÉÉ AVEC SUCCÈS :", result.id);

    revalidatePath("/dashboard/payments");
    return { success: true, data: purify(result) };
  } catch (error: any) {
    // Ce log te dira exactement quel champ manque ou est mal typé
    console.error("❌ ERREUR PRISMA DÉTAILLÉE :", error.message);
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