"use server";

import { revalidateTag } from "next/cache";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { SendMessageSchema } from "@/lib/validations";

export const sendMessageAction = createSafeAction(
	SendMessageSchema,
	async (data, { tenantId, userId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		const message = await tenantPrisma.message.create({
			data: {
				content: data.content,
				senderId: userId,
				recipientId: data.recipientId || null,
				etablissementId: tenantId,
			},
			include: {
				sender: {
					select: { firstName: true, lastName: true, role: true },
				},
				recipient: {
					select: { firstName: true, lastName: true, role: true },
				},
			},
		});

		revalidateTag(`etab_${tenantId}_messages`, "max");
		return message;
	},
);

export const getReceivedMessagesAction = createSafeAction(
	SendMessageSchema.pick({ content: true }).partial(),
	async (_, { tenantId, userId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		return await tenantPrisma.message.findMany({
			where: {
				recipientId: userId,
			},
			include: {
				sender: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						role: true,
						avatarUrl: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	},
);

export const getSentMessagesAction = createSafeAction(
	SendMessageSchema.pick({ content: true }).partial(),
	async (_, { tenantId, userId }) => {
		const tenantPrisma = getTenantPrisma(tenantId);
		return await tenantPrisma.message.findMany({
			where: {
				senderId: userId,
			},
			include: {
				recipient: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						role: true,
						avatarUrl: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	},
);
