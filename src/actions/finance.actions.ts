"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getEtablissementId() {
  const etablissement = await prisma.etablissement.findFirst();
  if (!etablissement) throw new Error("Établissement introuvable");
  return etablissement.id;
}

const purify = (data: any) => JSON.parse(JSON.stringify(data));

export async function createPaymentAction(data: any) {
  try {
    const etablissement = await prisma.etablissement.findFirst();
    if (!etablissement) throw new Error("Établissement non trouvé");

    const total = parseFloat(data.amount) || 0;
    const paid = parseFloat(data.paidAmount) || 0;

    const result = await prisma.paymentPlan.create({
      data: {
        totalAmount: total,
        paidAmount: paid,
        status: paid >= total ? "PAID" : "PARTIAL",
        currency: "DZD",
        etablissement: { connect: { id: etablissement.id } },
        student: { connect: { id: data.studentId } }
      },
    });

    revalidatePath("/dashboard/payments");
    return { success: true, data: purify(result) };
  } catch (error: any) {
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