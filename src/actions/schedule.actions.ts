// Actions pour la planification des séances
"use server";

import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";
import { revalidateTag } from "next/cache";
import { addMinutes } from "date-fns";

const CreateSessionSchema = z.object({
  activityId: z.string().uuid(),
  roomId: z.string().uuid(),
  instructorId: z.string().uuid(),
  groupId: z.string().uuid().optional().nullable(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  startTime: z.string(), // HH:mm
  isWeekly: z.boolean().optional(),
  weeksCount: z.number().min(1).max(52).optional().default(1),
});

export const createSessionAction = createSafeAction(CreateSessionSchema, async (data, { tenantId }) => {
  const tenantPrisma = getTenantPrisma(tenantId);
  
  const activity = await tenantPrisma.activity.findUnique({
    where: { id: data.activityId }
  });

  if (!activity) {
    throw new Error("Activité introuvable");
  }

  const baseStart = new Date(`${data.date}T${data.startTime}:00`);
  const duration = activity.duration || 60;
  
  const count = data.isWeekly ? (data.weeksCount || 1) : 1;
  const sessionsCreated = [];

  for (let i = 0; i < count; i++) {
    const start = new Date(baseStart.getTime());
    start.setDate(start.getDate() + (i * 7));
    
    const end = addMinutes(start, duration);

    const session = await tenantPrisma.session.create({
      data: {
        activityId: data.activityId,
        roomId: data.roomId,
        instructorId: data.instructorId,
        groupId: data.groupId as string,
        startTime: start,
        endTime: end,
        status: "SCHEDULED",
        etablissementId: tenantId,
      }
    });
    sessionsCreated.push(session);
  }

  revalidateTag(`sessions-${tenantId}`, "max");
  return sessionsCreated;
});

export const deleteSessionAction = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { tenantId }) => {
    const tenantPrisma = getTenantPrisma(tenantId);
    const result = await tenantPrisma.session.delete({ 
      where: { id, etablissementId: tenantId } 
    });
    revalidateTag(`sessions-${tenantId}`, "max");
    return result;
  }
);
