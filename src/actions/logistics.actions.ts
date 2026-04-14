"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { 
  MarkPresenceSchema, 
  RoomSchema, 
  ActivitySchema,
  CreateGroupSchema,
  UpdateGroupSchema
} from "@/lib/validations";
import { revalidateTag } from "next/cache";

export const createGroupAction = createSafeAction(CreateGroupSchema, async (data, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.groupe.create({ 
    data: { ...data, etablissementId: tenantId } as any 
  });
  revalidateTag(`groups-${tenantId}`, "max");
  return result;
});

export const updateGroupAction = createSafeAction(UpdateGroupSchema, async ({ id, ...data }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.groupe.update({ 
    where: { id, etablissementId: tenantId }, 
    data: { ...data, etablissementId: tenantId } 
  });
  revalidateTag(`groups-${tenantId}`, "max");
  return result;
});

export const deleteGroupAction = createSafeAction(z.object({ id: z.string().uuid() }), async ({ id }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.groupe.delete({ where: { id, etablissementId: tenantId } });
  revalidateTag(`groups-${tenantId}`, "max");
  return result;
});

export const createRoomAction = createSafeAction(RoomSchema, async (data, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.room.create({ 
    data: { ...data, etablissementId: tenantId } as any 
  });
  revalidateTag(`rooms-${tenantId}`, "max");
  return result;
});

export const updateRoomAction = createSafeAction(RoomSchema.extend({ id: z.string().uuid() }), async ({ id, ...data }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.room.update({ 
    where: { id, etablissementId: tenantId }, 
    data: { ...data, etablissementId: tenantId } 
  });
  revalidateTag(`rooms-${tenantId}`, "max");
  return result;
});

export const deleteRoomAction = createSafeAction(z.object({ id: z.string().uuid() }), async ({ id }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.room.delete({ where: { id, etablissementId: tenantId } });
  revalidateTag(`rooms-${tenantId}`, "max");
  return result;
});

export const createActivityAction = createSafeAction(ActivitySchema, async (data, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.activity.create({ 
    data: { ...data, etablissementId: tenantId } as any 
  });
  revalidateTag(`activities-${tenantId}`, "max");
  return result;
});

export const updateActivityAction = createSafeAction(ActivitySchema.extend({ id: z.string().uuid() }), async ({ id, ...data }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.activity.update({ 
    where: { id, etablissementId: tenantId }, 
    data: { ...data, etablissementId: tenantId } 
  });
  revalidateTag(`activities-${tenantId}`, "max");
  return result;
});

export const deleteActivityAction = createSafeAction(z.object({ id: z.string().uuid() }), async ({ id }, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  const result = await tenantPrisma.activity.delete({ where: { id, etablissementId: tenantId } });
  revalidateTag(`activities-${tenantId}`, "max");
  return result;
});

export const markPresenceAction = createSafeAction(
  MarkPresenceSchema,
  async (data, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);

    const seance = await tenantPrisma.session.findUnique({ 
      where: { id: data.seanceId, etablissementId: tenantId } 
    });
    if (!seance) {
      throw new TaysirError("Séance introuvable.", ErrorCodes.ERR_NOT_FOUND, 404);
    }

    const result = await tenantPrisma.attendanceRecord.upsert({
      where: { 
        sessionId_studentId: { 
          sessionId: data.seanceId, 
          studentId: data.participantId 
        },
        etablissementId: tenantId
      } as any,
      create: {
        status: data.statut,
        retardMinutes: data.retard || 0,
        note: data.note,
        sessionId: data.seanceId,
        studentId: data.participantId,
        etablissementId: tenantId,
      } as any,
      update: {
        status: data.statut,
        retardMinutes: data.retard || 0,
        note: data.note,
        etablissementId: tenantId,
      },
    });

    revalidateTag(`attendance-${tenantId}`, "max");
    return result;
  }
);
