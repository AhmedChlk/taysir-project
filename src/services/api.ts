// Fonctions pour récupérer les données (Server Side Only)

import "server-only";
import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth/next";
import { cache } from "react";
import { authOptions } from "@/lib/auth";
import { ErrorCodes, TaysirError } from "@/lib/errors";
import { money, moneyOrNull } from "@/lib/money";
import { getTenantPrisma, prisma } from "@/lib/prisma";
import { computeWeeklyAttendanceRatios } from "@/lib/queries/attendance";

// Conversion des champs monétaires Decimal → number à la frontière lecture DB
// → Client Components (voir src/lib/money.ts). Types concrets : le spread
// `{ ...obj, totalAmount: number }` écrase proprement le champ d'origine.

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

	// Le SUPER_ADMIN opère exclusivement sur /superadmin (client GLOBAL_ACCESS
	// restreint). Retourner le client `prisma` brut ici fusionnerait les données
	// de TOUS les établissements et défait l'isolation multi-tenant : on refuse.
	if (user.role === "SUPER_ADMIN") {
		throw new TaysirError(
			"Le SUPER_ADMIN n'accède pas aux données d'un établissement via le tableau de bord.",
			ErrorCodes.ERR_FORBIDDEN,
			403,
		);
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

	const user = await prisma.user.findUnique({
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

	if (!user) return null;
	return "salary" in user
		? { ...user, salary: moneyOrNull(user.salary as never) }
		: user;
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

	const staff = await client.user.findMany({
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
			_count: { select: { sessions: true } },
		},
	});

	return staff.map((u) =>
		"salary" in u ? { ...u, salary: moneyOrNull(u.salary as never) } : u,
	);
};

// Liste des salles
export const getRooms = async () => {
	const client = await getPrisma();
	return await client.room.findMany();
};

// Salles + nombre de séances qui les occupent (dépendance Planning)
export const getRoomsWithUsage = async () => {
	const client = await getPrisma();
	return await client.room.findMany({
		include: { _count: { select: { sessions: true } } },
		orderBy: { name: "asc" },
	});
};

// Liste des activités
export const getActivities = async () => {
	const client = await getPrisma();
	return await client.activity.findMany();
};

// Activités + usage (séances planifiées + plans de paiement liés)
export const getActivitiesWithUsage = async () => {
	const client = await getPrisma();
	return await client.activity.findMany({
		include: {
			_count: { select: { sessions: true, paymentPlans: true } },
		},
		orderBy: { name: "asc" },
	});
};

// Liste des groupes
export const getGroups = async () => {
	const client = await getPrisma();
	return await client.groupe.findMany({
		include: { students: true },
	});
};

// Liste des séances
export const getSessions = async (options?: {
	instructorId?: string;
	date?: Date;
}) => {
	const session = await getServerSession(authOptions);
	const client = await getPrisma();
	const user = session?.user;

	const where: Prisma.SessionWhereInput = {};
	if (user?.role === "INTERVENANT") {
		where.instructorId = user.id;
	} else if (options?.instructorId) {
		where.instructorId = options.instructorId;
	}

	if (options?.date) {
		const startOfDay = new Date(options.date);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(options.date);
		endOfDay.setHours(23, 59, 59, 999);
		where.startTime = {
			gte: startOfDay,
			lte: endOfDay,
		};
	}

	return await client.session.findMany({
		where,
		include: { room: true, activity: true, group: true },
		orderBy: { startTime: "desc" },
	});
};

// Liste des élèves
export const getStudents = async () => {
	const session = await getServerSession(authOptions);
	const tenantId = session?.user?.etablissementId;

	// Pas de tenant rattaché (y compris SUPER_ADMIN) → aucune donnée élève
	// n'est servie ici. Le SUPER_ADMIN passe par /superadmin, jamais par cette
	// liste tenant (sinon fuite cross-tenant de PII).
	if (!tenantId) {
		return [];
	}

	return await unstable_cache(
		async () => {
			const client = await getPrisma();
			const students = await client.student.findMany({
				include: { groups: true, paymentPlans: true },
			});
			return students.map((s) => ({
				...s,
				paymentPlans: s.paymentPlans.map((p) => ({
					...p,
					totalAmount: money(p.totalAmount),
					paidAmount: money(p.paidAmount),
				})),
			}));
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
	const plans = await client.paymentPlan.findMany({
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
	return plans.map((p) => ({
		...p,
		totalAmount: money(p.totalAmount),
		paidAmount: money(p.paidAmount),
		tranches: p.tranches.map((t) => ({
			...t,
			amount: money(t.amount),
			paiements: t.paiements.map((pm) => ({
				...pm,
				amount: money(pm.amount),
			})),
		})),
	}));
};

// Dernière relance par élève (journal de relance) → { studentId: ISO date }
export const getLatestRelanceByStudent = async (): Promise<
	Record<string, string>
> => {
	const client = await getPrisma();
	const relances = await client.relance.findMany({
		orderBy: { sentAt: "desc" },
		select: { studentId: true, sentAt: true },
	});
	const map: Record<string, string> = {};
	for (const r of relances) {
		if (!map[r.studentId]) map[r.studentId] = r.sentAt.toISOString();
	}
	return map;
};

// Liste des présences
export const getAttendance = async () => {
	const client = await getPrisma();
	return await client.attendanceRecord.findMany();
};

export const getAttendanceForSessions = async (sessionIds: string[]) => {
	const client = await getPrisma();
	if (sessionIds.length === 0) return [];
	return await client.attendanceRecord.findMany({
		where: { sessionId: { in: sessionIds } },
	});
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
