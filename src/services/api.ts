// Fonctions pour récupérer les données (Server Side Only)

import "server-only";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth/next";
import { cache } from "react";
import { authOptions } from "@/lib/auth";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { getTenantPrisma, prisma } from "@/lib/prisma";
import { computeWeeklyAttendanceRatios } from "@/lib/queries/attendance";

/**
 * RÉCUPÉRATION DU PRISMA MÉMOÏSÉE (PERFORMANCE)
 * Utilise React Cache pour ne pas appeler getServerSession plusieurs fois par requête.
 */
const getPrisma = cache(async () => {
	const session = await getServerSession(authOptions);
	const user = session?.user;

	if (!session || !user) {
		throw new TaysirError(
			"Accès refusé : Session non valide.",
			ErrorCodes.ERR_UNAUTHORIZED,
			401,
		);
	}

	if (user.role === "SUPER_ADMIN") {
		return prisma;
	}

	if (!user.etablissementId) {
		throw new TaysirError(
			"Accès refusé : Aucun établissement rattaché.",
			ErrorCodes.ERR_UNAUTHORIZED,
			401,
		);
	}

	return getTenantPrisma(user.etablissementId);
});

// Récupérer les infos de l'école actuelle
export const getCurrentTenant = cache(async () => {
	const session = await getServerSession(authOptions);
	const tenantId = session?.user?.etablissementId;

	if (!tenantId) return null;

	return await prisma.etablissement.findUnique({
		where: { id: tenantId },
	});
});

// Récupérer l'utilisateur connecté
export const getCurrentUser = cache(async () => {
	const session = await getServerSession(authOptions);
	const userId = session?.user?.id;
	const userRole = session?.user?.role;

	if (!userId) return null;

	return await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
			role: true,
			avatarUrl: true,
			status: true,
			salary: userRole === "GERANT",
			etablissementId: true,
		},
	});
});

// Liste des écoles
export const getTenants = async () => {
	return await prisma.etablissement.findMany();
};

// Liste du staff
export const getStaff = async () => {
	const client = await getPrisma();
	const session = await getServerSession(authOptions);
	const userRole = session?.user?.role;

	return await client.user.findMany({
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
			role: true,
			avatarUrl: true,
			status: true,
			salary: userRole === "GERANT",
			createdAt: true,
			updatedAt: true,
		},
	});
};

// Liste des salles
export const getRooms = async () => {
	const client = await getPrisma();
	return await client.room.findMany();
};

// Liste des activités
export const getActivities = async () => {
	const client = await getPrisma();
	return await client.activity.findMany();
};

// Liste des groupes
export const getGroups = async () => {
	const client = await getPrisma();
	return await client.groupe.findMany({
		include: { students: true },
	});
};

// Liste des séances
export const getSessions = async () => {
	const client = await getPrisma();
	return await client.session.findMany({
		include: { room: true, activity: true, group: true },
	});
};

// Liste des élèves
export const getStudents = async () => {
	const session = await getServerSession(authOptions);
	const tenantId = session?.user?.etablissementId;

	if (!tenantId) {
		if (session?.user?.role === "SUPER_ADMIN") {
			return await prisma.student.findMany({ include: { groups: true } });
		}
		return [];
	}

	return await unstable_cache(
		async () => {
			const client = await getPrisma();
			return await client.student.findMany({
				include: { groups: true },
			});
		},
		[`students-list-${tenantId}`],
		{
			tags: [`students-${tenantId}`],
			revalidate: 3600, // Cache d'une heure par défaut, invalidé par tag
		},
	)();
};

// Liste des paiements (PaymentPlans)
export const getPayments = async () => {
	const client = await getPrisma();
	return await client.paymentPlan.findMany({
		include: {
			student: true,
			activity: true, // Inclure l'activité suite au mandat de structure
			tranches: {
				include: { paiements: true },
				orderBy: { dueDate: "asc" },
			},
		},
		orderBy: { createdAt: "desc" },
	});
};

// Liste des présences
export const getAttendance = async () => {
	const client = await getPrisma();
	return await client.attendanceRecord.findMany();
};

// Statistiques de présence pour le graphique
// Délègue au helper partagé src/lib/queries/attendance.ts (ARCH-01)
export const getAttendanceStats = async () => {
	const session = await getServerSession(authOptions);
	const tenantId = session?.user?.etablissementId;
	const client = await getPrisma();
	return computeWeeklyAttendanceRatios(
		client as Parameters<typeof computeWeeklyAttendanceRatios>[0],
		tenantId,
	);
};
