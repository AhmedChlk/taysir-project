"use server";

import { getTenantPrisma } from "@/lib/prisma";
import { createSafeAction } from "@/lib/actions/safe-action";
import { SendMessageSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export const sendMessageAction = createSafeAction(
  SendMessageSchema,
  async (data, { tenantId, userId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    const message = await tenantPrisma.message.create({
      data: {
        content: data.content,
        senderId: userId,
        recipientId: data.recipientId || null,
      },
      include: {
        sender: {
          select: { firstName: true, lastName: true, role: true }
        },
        recipient: {
          select: { firstName: true, lastName: true, role: true }
        }
      }
    });

    revalidatePath("/dashboard/messages");
    return message;
  }
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
          select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
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
          select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
);
