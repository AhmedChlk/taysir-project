"use server";

import { z } from "zod";
import { createSafeAction, FRONTDESK_ROLES } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";

const LogRelanceSchema = z.object({
	studentId: z.string().min(1),
	paymentPlanId: z.string().optional(),
	amount: z.number().nonnegative(),
	daysLate: z.number().int().nonnegative().default(0),
});

/* Journal de relance — trace chaque rappel WhatsApp envoyé (qui, quand,
   combien). Le sentById = utilisateur connecté ; etablissementId est injecté
   par le client tenant. */
export const logRelanceAction = createSafeAction(
	LogRelanceSchema,
	async (data, { tenantId, userId }) => {
		const client = getTenantPrisma(tenantId);
		await client.relance.create({
			data: {
				etablissementId: tenantId,
				studentId: data.studentId,
				paymentPlanId: data.paymentPlanId ?? null,
				amount: data.amount,
				daysLate: data.daysLate,
				sentById: userId,
				channel: "WHATSAPP",
			},
		});
		return { ok: true };
	},
	{ requiredRole: FRONTDESK_ROLES },
);
