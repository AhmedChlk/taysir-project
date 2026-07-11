"use server";

import {
	addMinutes,
	endOfDay,
	endOfMonth,
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfWeek,
	subDays,
	subMonths,
} from "date-fns";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { money, moneyOrNull } from "@/lib/money";
import { overdueInfo } from "@/lib/payment-aging";
import { getTenantPrisma } from "@/lib/prisma";
import { computeWeeklyAttendanceRatios } from "@/lib/queries/attendance";

export const getDashboardStatsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const [totalStudents, activeStudents] = await Promise.all([
			client.student.count(),
			client.student.count({
				where: { isActive: true },
			}),
		]);

		return {
			total: totalStudents,
			active: activeStudents,
			inactive: totalStudents - activeStudents,
		};
	},
);

export const getTodaySessionsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();

		return await client.session.findMany({
			where: {
				startTime: {
					gte: startOfDay(now),
					lte: endOfDay(now),
				},
			},
			include: {
				room: true,
				activity: true,
				group: true,
				instructor: {
					select: { firstName: true, lastName: true },
				},
			},
			orderBy: { startTime: "asc" },
		});
	},
);

export const getPendingPaymentsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const pendingPlans = await client.paymentPlan.findMany({
			where: {
				status: { in: ["PENDING", "PARTIAL"] },
			},
			include: {
				student: true,
				tranches: {
					where: { isPaid: false },
					orderBy: { dueDate: "asc" },
				},
			},
		});

		const plansMoney = pendingPlans.map((plan) => ({
			...plan,
			totalAmount: money(plan.totalAmount),
			paidAmount: money(plan.paidAmount),
			tranches: plan.tranches.map((t) => ({
				...t,
				amount: money(t.amount),
			})),
		}));

		const totalPendingAmount = plansMoney.reduce(
			(acc, plan) => acc + (plan.totalAmount - plan.paidAmount),
			0,
		);

		return {
			count: plansMoney.length,
			totalAmount: totalPendingAmount,
			plans: plansMoney,
		};
	},
);

export const getAttendanceStatsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		return computeWeeklyAttendanceRatios(
			client as Parameters<typeof computeWeeklyAttendanceRatios>[0],
			tenantId,
		);
	},
);

export const getRoomOccupancyAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();

		const [totalRooms, activeSessionRooms] = await Promise.all([
			client.room.count({ where: { etablissementId: tenantId } }),
			// Salles DISTINCTES occupées maintenant : deux séances qui se chevauchent
			// dans la même salle ne comptent qu'une fois (sinon le taux > 100%).
			client.session.findMany({
				where: {
					etablissementId: tenantId,
					startTime: { lte: now },
					endTime: { gte: now },
					status: "SCHEDULED",
				},
				distinct: ["roomId"],
				select: { roomId: true },
			}),
		]);

		const occupiedRooms = Math.min(activeSessionRooms.length, totalRooms);

		return {
			totalRooms,
			occupiedRooms,
			rate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
		};
	},
);

export const getDailyAttendanceRatioAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();

		const sessionsToday = await client.session.findMany({
			where: {
				etablissementId: tenantId,
				startTime: { gte: startOfDay(now), lte: endOfDay(now) },
			},
			select: {
				id: true,
				attendance: { select: { status: true } },
			},
		});

		let totalExpected = 0;
		let totalPresent = 0;

		sessionsToday.forEach((session: { attendance: { status: string }[] }) => {
			totalExpected += session.attendance.length;
			totalPresent += session.attendance.filter(
				(a: { status: string }) =>
					a.status === "PRESENT" || a.status === "RETARD",
			).length;
		});

		return {
			ratio:
				totalExpected > 0
					? Math.round((totalPresent / totalExpected) * 100)
					: 0,
			totalExpected,
			totalPresent,
		};
	},
);

export const getUpcomingStaffAlertsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();
		const in30Mins = addMinutes(now, 30);

		return await client.session.findMany({
			where: {
				etablissementId: tenantId,
				startTime: { gte: now, lte: in30Mins },
				status: "SCHEDULED",
			},
			include: {
				instructor: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						avatarUrl: true,
					},
				},
				room: { select: { name: true } },
				activity: { select: { name: true } },
			},
			orderBy: { startTime: "asc" },
		});
	},
);

export const getFinancialKPIsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();
		const monthStart = startOfMonth(now);
		const monthEnd = endOfMonth(now);

		const monthlyPayments = await client.paiement.findMany({
			where: {
				etablissementId: tenantId,
				date: {
					gte: monthStart,
					lte: monthEnd,
				},
			},
			select: { amount: true },
		});

		const totalRevenue = monthlyPayments.reduce(
			(acc, p) => acc + money(p.amount),
			0,
		);

		return {
			monthlyRevenue: totalRevenue,
			currency: "DZD",
		};
	},
);

/* One aggregated read powering the director cockpit — money first, then today,
   then the people. Keeps the dashboard component clean and the data real. */
export const getDirectorOverviewAction = createSafeAction(
	z.object({}),
	async (_, { tenantId, userId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();
		const startMonth = startOfMonth(now);
		const endMonth = endOfMonth(now);
		// Trailing 30-day window for the "absences répétées" alert.
		const absSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		// Trailing 7-day window for presence rate + "pointage manquant" alert.
		const weekSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const [
			totalStudents,
			activeStudents,
			staffCount,
			plans,
			monthlyPaiements,
			todaySessions,
			recentAbsences,
			weekAttendance,
			weekSessions,
			teachesCount,
			trendPaiements,
		] = await Promise.all([
			client.student.count(),
			client.student.count({ where: { isActive: true } }),
			client.user.count({
				where: { role: { in: ["INTERVENANT", "GERANT", "ADMIN"] } },
			}),
			client.paymentPlan.findMany({
				include: {
					student: {
						select: {
							firstName: true,
							lastName: true,
							phone: true,
							parentPhone: true,
						},
					},
					tranches: { select: { amount: true, dueDate: true, isPaid: true } },
				},
			}),
			client.paiement.findMany({
				where: { date: { gte: startMonth, lte: endMonth } },
				select: { amount: true },
			}),
			client.session.findMany({
				where: { startTime: { gte: startOfDay(now), lte: endOfDay(now) } },
				include: {
					room: { select: { name: true } },
					activity: { select: { name: true } },
					group: { select: { name: true } },
					instructor: { select: { firstName: true, lastName: true } },
					attendance: { select: { status: true } },
				},
				orderBy: { startTime: "asc" },
			}),
			// Unjustified absences in the trailing 30 days, to flag at-risk students.
			client.attendanceRecord.findMany({
				where: {
					status: "ABSENT",
					session: { startTime: { gte: absSince } },
				},
				select: {
					studentId: true,
					student: { select: { firstName: true, lastName: true } },
				},
			}),
			// Attendance over the last 7 days → présence moyenne + série journalière.
			client.attendanceRecord.findMany({
				where: { session: { startTime: { gte: weekSince, lte: now } } },
				select: {
					status: true,
					session: { select: { startTime: true } },
				},
			}),
			// Séances passées (7 j) SANS pointage, restreintes à celles que le
			// gérant assure lui-même (il peut aussi enseigner). Un gérant qui
			// n'enseigne pas n'a donc aucune alerte de pointage.
			client.session.findMany({
				where: {
					startTime: { gte: weekSince, lt: now },
					instructorId: userId,
				},
				select: {
					id: true,
					startTime: true,
					activity: { select: { name: true } },
					group: { select: { name: true } },
					_count: { select: { attendance: true } },
				},
				orderBy: { startTime: "desc" },
			}),
			// Le gérant enseigne-t-il ? (au moins une séance où il est intervenant)
			client.session.count({ where: { instructorId: userId } }),
			// Encaissements des 6 derniers mois (mois courant inclus) → courbe de
			// trésorerie + comparatif mois précédent. Une seule requête, buckets
			// calculés en mémoire.
			client.paiement.findMany({
				where: { date: { gte: startOfMonth(subMonths(now, 5)), lte: now } },
				select: { amount: true, date: true },
			}),
		]);

		const plansMoney = plans.map((p) => ({
			...p,
			totalAmount: money(p.totalAmount),
			paidAmount: money(p.paidAmount),
			tranches: p.tranches.map((t) => ({ ...t, amount: money(t.amount) })),
		}));

		const totalDue = plansMoney.reduce((a, p) => a + p.totalAmount, 0);
		const totalPaid = plansMoney.reduce((a, p) => a + p.paidAmount, 0);
		const resteARecouvrer = Math.max(0, totalDue - totalPaid);
		const tauxRecouvrement =
			totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
		const encaisseCeMois = monthlyPaiements.reduce(
			(a, p) => a + money(p.amount),
			0,
		);

		const overdue = plansMoney
			.map((p) => {
				const info = overdueInfo(p, now);
				return {
					studentId: p.studentId,
					paymentPlanId: p.id,
					firstName: p.student.firstName,
					lastName: p.student.lastName,
					phone: p.student.parentPhone || p.student.phone || null,
					remaining: Math.max(0, p.totalAmount - p.paidAmount),
					overdueAmount: info.overdueAmount,
					daysLate: info.daysLate,
				};
			})
			.filter((o) => o.overdueAmount > 0)
			.sort((a, b) => b.daysLate - a.daysLate);

		// Absences répétées — group ABSENT records by student, flag ≥ 3 in 30 j.
		const ABS_THRESHOLD = 3;
		const absByStudent = new Map<
			string,
			{ firstName: string; lastName: string; count: number }
		>();
		for (const a of recentAbsences) {
			const cur = absByStudent.get(a.studentId);
			if (cur) {
				cur.count += 1;
			} else {
				absByStudent.set(a.studentId, {
					firstName: a.student.firstName,
					lastName: a.student.lastName,
					count: 1,
				});
			}
		}
		const absencesAlertes = [...absByStudent.entries()]
			.map(([studentId, v]) => ({ studentId, ...v }))
			.filter((v) => v.count >= ABS_THRESHOLD)
			.sort((a, b) => b.count - a.count);

		let expected = 0;
		let present = 0;
		for (const s of todaySessions) {
			expected += s.attendance.length;
			present += s.attendance.filter(
				(a) => a.status === "PRESENT" || a.status === "RETARD",
			).length;
		}

		// Présence moyenne sur 7 jours.
		const weekPresent = weekAttendance.filter(
			(a) => a.status === "PRESENT" || a.status === "RETARD",
		).length;
		const presence7j =
			weekAttendance.length > 0
				? Math.round((weekPresent / weekAttendance.length) * 100)
				: null;

		// Série présence sur 7 jours glissants (une valeur % par jour, du plus
		// ancien au plus récent) → sparkline sur le KPI présence.
		const attendance7dSeries: number[] = [];
		for (let i = 6; i >= 0; i--) {
			const day = subDays(now, i);
			const dayStart = startOfDay(day).getTime();
			const dayEnd = endOfDay(day).getTime();
			const dayRecords = weekAttendance.filter((a) => {
				const t = a.session.startTime.getTime();
				return t >= dayStart && t <= dayEnd;
			});
			if (dayRecords.length === 0) {
				attendance7dSeries.push(0);
			} else {
				const p = dayRecords.filter(
					(a) => a.status === "PRESENT" || a.status === "RETARD",
				).length;
				attendance7dSeries.push(Math.round((p / dayRecords.length) * 100));
			}
		}

		// Encaissements agrégés par mois sur 6 mois (du plus ancien au courant).
		const revenueSeries: { label: string; value: number }[] = [];
		for (let i = 5; i >= 0; i--) {
			const m = subMonths(now, i);
			const ms = startOfMonth(m).getTime();
			const me = endOfMonth(m).getTime();
			const total = trendPaiements.reduce((acc, p) => {
				const t = p.date.getTime();
				return t >= ms && t <= me ? acc + money(p.amount) : acc;
			}, 0);
			revenueSeries.push({ label: m.toISOString(), value: total });
		}
		// Comparatif mois courant vs mois précédent (delta %).
		const prevStart = startOfMonth(subMonths(now, 1)).getTime();
		const prevEnd = endOfMonth(subMonths(now, 1)).getTime();
		const encaisseMoisPrecedent = trendPaiements.reduce((acc, p) => {
			const t = p.date.getTime();
			return t >= prevStart && t <= prevEnd ? acc + money(p.amount) : acc;
		}, 0);
		const revenueDeltaPct =
			encaisseMoisPrecedent > 0
				? Math.round(
						((encaisseCeMois - encaisseMoisPrecedent) / encaisseMoisPrecedent) *
							100,
					)
				: null;

		// Séances passées sans pointage saisi (gap opérationnel à combler).
		const sansPointage = weekSessions.filter((s) => s._count.attendance === 0);

		return {
			students: { total: totalStudents, active: activeStudents },
			staffCount,
			finance: { encaisseCeMois, resteARecouvrer, tauxRecouvrement },
			// Tendances (graphes) + comparatif période.
			trends: {
				revenue: revenueSeries,
				attendance: attendance7dSeries,
			},
			compare: {
				encaisseMoisPrecedent,
				revenueDeltaPct,
			},
			recouvrement: {
				count: overdue.length,
				amount: overdue.reduce((a, o) => a + o.overdueAmount, 0),
				top: overdue.slice(0, 5),
			},
			today: {
				sessions: todaySessions.map((s) => ({
					id: s.id,
					start: s.startTime,
					activity: s.activity?.name ?? "—",
					group: s.group?.name ?? "—",
					room: s.room?.name ?? null,
					instructor: s.instructor
						? `${s.instructor.firstName} ${s.instructor.lastName}`
						: null,
				})),
				count: todaySessions.length,
				presentRatio:
					expected > 0 ? Math.round((present / expected) * 100) : null,
			},
			presence7j,
			// Le gérant assure-t-il des séances ? → conditionne l'affichage de
			// l'appel sur son cockpit (gérant qui enseigne aussi).
			teaches: teachesCount > 0,
			alertes: {
				absences: {
					count: absencesAlertes.length,
					top: absencesAlertes.slice(0, 5),
				},
				sansPointage: {
					count: sansPointage.length,
					top: sansPointage.slice(0, 5).map((s) => ({
						id: s.id,
						start: s.startTime,
						activity: s.activity?.name ?? "—",
						group: s.group?.name ?? "—",
					})),
				},
			},
		};
	},
);

/* Espace enseignant (INTERVENANT) — strictement SES séances (instructorId ===
   userId), du jour et de la semaine, + ce qu'il reste à pointer + ses groupes.
   Données scopées au prof : un prof ne voit jamais les séances d'un autre. */
export const getTeacherOverviewAction = createSafeAction(
	z.object({}),
	async (_, { tenantId, userId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();
		const weekStart = startOfWeek(now, { weekStartsOn: 1 });
		const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
		const dayStart = startOfDay(now);
		const dayEnd = endOfDay(now);

		const weekSessions = await client.session.findMany({
			where: {
				instructorId: userId,
				startTime: { gte: weekStart, lte: weekEnd },
			},
			include: {
				activity: { select: { name: true } },
				group: {
					select: {
						id: true,
						name: true,
						_count: { select: { students: true } },
					},
				},
				room: { select: { name: true } },
				_count: { select: { attendance: true } },
			},
			orderBy: { startTime: "asc" },
		});

		const mapSession = (s: (typeof weekSessions)[number]) => ({
			id: s.id,
			start: s.startTime,
			end: s.endTime,
			status: s.status,
			activity: s.activity?.name ?? "—",
			group: s.group?.name ?? "—",
			groupId: s.group?.id ?? null,
			room: s.room?.name ?? null,
			roster: s.group?._count.students ?? 0,
			attendanceTaken: s._count.attendance > 0,
		});

		const today = weekSessions
			.filter((s) => s.startTime >= dayStart && s.startTime <= dayEnd)
			.map(mapSession);
		const week = weekSessions.map(mapSession);

		// À pointer : séances du jour déjà commencées sans aucune présence saisie.
		const toPoint = today.filter(
			(s) => !s.attendanceTaken && new Date(s.start) <= now,
		);

		// Mes groupes (lecture) — uniques, avec effectif.
		const groupsMap = new Map<
			string,
			{ id: string; name: string; roster: number }
		>();
		for (const s of weekSessions) {
			if (s.group && !groupsMap.has(s.group.id)) {
				groupsMap.set(s.group.id, {
					id: s.group.id,
					name: s.group.name,
					roster: s.group._count.students,
				});
			}
		}
		const myGroups = [...groupsMap.values()];

		return {
			today,
			week,
			myGroups,
			counts: {
				todayCount: today.length,
				toPoint: toPoint.length,
				weekCount: week.length,
				groups: myGroups.length,
				places: myGroups.reduce((a, g) => a + g.roster, 0),
			},
		};
	},
);

/* Guichet secrétaire (SECRETAIRE) — front-desk : ce qu'il y a à encaisser
   aujourd'hui, les inscriptions récentes/du mois, les séances du jour. */
export const getSecretaryOverviewAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();
		const startMonth = startOfMonth(now);
		const endMonth = endOfMonth(now);
		const dayEnd = endOfDay(now);

		const [todaySessionsCount, monthRegistrations, recentStudents, plans] =
			await Promise.all([
				client.session.count({
					where: { startTime: { gte: startOfDay(now), lte: dayEnd } },
				}),
				client.student.count({
					where: { registrationDate: { gte: startMonth, lte: endMonth } },
				}),
				client.student.findMany({
					orderBy: { registrationDate: "desc" },
					take: 6,
					select: {
						id: true,
						firstName: true,
						lastName: true,
						registrationDate: true,
						isActive: true,
					},
				}),
				client.paymentPlan.findMany({
					where: { status: { in: ["PENDING", "PARTIAL"] } },
					include: {
						student: { select: { firstName: true, lastName: true } },
						tranches: {
							where: { isPaid: false, dueDate: { lte: dayEnd } },
							select: { id: true, amount: true, dueDate: true },
						},
					},
				}),
			]);

		// Échéances à encaisser : tranches dues (aujourd'hui ou en retard), non payées.
		const aEncaisser = plans
			.flatMap((p) =>
				p.tranches.map((tr) => ({
					trancheId: tr.id,
					planId: p.id,
					studentId: p.studentId,
					firstName: p.student.firstName,
					lastName: p.student.lastName,
					amount: money(tr.amount),
					dueDate: tr.dueDate,
					overdue: tr.dueDate < startOfDay(now),
				})),
			)
			.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

		return {
			counts: {
				aEncaisserAmount: aEncaisser.reduce((s, t) => s + t.amount, 0),
				aEncaisserCount: aEncaisser.length,
				monthRegistrations,
				todaySessions: todaySessionsCount,
			},
			aEncaisser: aEncaisser.slice(0, 6),
			recentStudents,
		};
	},
);

export const getDashboardFormDataAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();

		const [
			rooms,
			activities,
			staff,
			groups,
			students,
			todaySessions,
			pendingPayments,
		] = await Promise.all([
			client.room.findMany({
				where: { etablissementId: tenantId },
				orderBy: { name: "asc" },
			}),
			client.activity.findMany({
				where: { etablissementId: tenantId },
				orderBy: { name: "asc" },
			}),
			client.user.findMany({
				where: {
					etablissementId: tenantId,
					role: { in: ["INTERVENANT", "GERANT", "ADMIN"] },
				},
				orderBy: { lastName: "asc" },
			}),
			client.groupe.findMany({
				where: { etablissementId: tenantId },
				orderBy: { name: "asc" },
			}),
			client.student.findMany({
				where: { etablissementId: tenantId, isActive: true },
				orderBy: { lastName: "asc" },
			}),
			client.session.findMany({
				where: {
					etablissementId: tenantId,
					startTime: {
						gte: startOfDay(now),
						lte: endOfDay(now),
					},
				},
				include: {
					room: true,
					activity: true,
					group: true,
					instructor: {
						select: { firstName: true, lastName: true, avatarUrl: true },
					},
				},
				orderBy: { startTime: "asc" },
			}),
			client.paymentPlan.findMany({
				where: {
					etablissementId: tenantId,
					status: { in: ["PENDING", "PARTIAL"] },
				},
				include: {
					student: true,
					tranches: {
						where: { isPaid: false },
						orderBy: { dueDate: "asc" },
					},
				},
			}),
		]);

		const staffMoney = staff.map((u) => ({
			...u,
			salary: moneyOrNull(u.salary),
		}));
		const pendingMoney = pendingPayments.map((plan) => ({
			...plan,
			totalAmount: money(plan.totalAmount),
			paidAmount: money(plan.paidAmount),
			tranches: plan.tranches.map((t) => ({ ...t, amount: money(t.amount) })),
		}));

		return {
			rooms,
			activities,
			staff: staffMoney,
			groups,
			students,
			todaySessions,
			pendingPayments: pendingMoney,
			totalPendingAmount: pendingMoney.reduce(
				(acc, plan) => acc + (plan.totalAmount - plan.paidAmount),
				0,
			),
		};
	},
);

/* ==========================================================================
   Notifications — DÉRIVÉES (aucune table dédiée). On recalcule à la volée les
   faits marquants de l'établissement (impayés en retard, absences répétées,
   séances sans pointage, nouvelles inscriptions) à partir des données
   existantes. Chaque notif porte un horodatage `at` = date de l'évènement le
   plus récent de sa catégorie. Une notif est « non lue » si `at` est postérieur
   à `user.notificationsSeenAt`. Ouvrir la cloche appelle markNotificationsSeen.

   Périmètre : pilotage (GERANT/ADMIN). Les autres rôles ne reçoivent rien pour
   l'instant → cloche sans badge. À étendre par rôle si besoin.
   ========================================================================== */

export type NotificationType =
	| "overdue"
	| "absences"
	| "unmarked"
	| "enrollment";

export interface NotificationItem {
	id: string;
	type: NotificationType;
	count: number;
	amount: number;
	/** ISO — date de l'évènement le plus récent de la catégorie. */
	at: string;
}

export const getNotificationsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId, userId, role }) => {
		const client = getTenantPrisma(tenantId);

		const me = await client.user.findUnique({
			where: { id: userId },
			select: { notificationsSeenAt: true },
		});
		const seenAt = me?.notificationsSeenAt ?? null;

		// Seul le pilotage reçoit les notifications de gestion.
		if (role !== "GERANT" && role !== "ADMIN") {
			return { items: [] as NotificationItem[], unreadCount: 0, seenAt };
		}

		const now = new Date();
		const absSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const weekSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const [plans, absents30, unmarkedSessions, newStudents] = await Promise.all(
			[
				client.paymentPlan.findMany({
					include: {
						student: { select: { firstName: true, lastName: true } },
						tranches: { select: { amount: true, dueDate: true, isPaid: true } },
					},
				}),
				client.attendanceRecord.findMany({
					where: {
						status: "ABSENT",
						session: { startTime: { gte: absSince } },
					},
					select: {
						studentId: true,
						session: { select: { startTime: true } },
					},
				}),
				client.session.findMany({
					where: {
						startTime: { gte: weekSince, lt: now },
						instructorId: userId,
						attendance: { none: {} },
					},
					select: { startTime: true },
					orderBy: { startTime: "desc" },
				}),
				client.student.findMany({
					where: { registrationDate: { gte: weekSince } },
					select: { registrationDate: true },
					orderBy: { registrationDate: "desc" },
				}),
			],
		);

		const items: NotificationItem[] = [];

		// 1. Impayés en retard.
		const plansMoney = plans.map((p) => ({
			...p,
			totalAmount: money(p.totalAmount),
			paidAmount: money(p.paidAmount),
			tranches: p.tranches.map((t) => ({ ...t, amount: money(t.amount) })),
		}));
		let overdueCount = 0;
		let overdueAmount = 0;
		let overdueAt = 0;
		for (const p of plansMoney) {
			const info = overdueInfo(p, now);
			if (info.overdueAmount <= 0) continue;
			overdueCount += 1;
			overdueAmount += info.overdueAmount;
			for (const tr of p.tranches) {
				const due = tr.dueDate?.getTime() ?? 0;
				if (!tr.isPaid && due < now.getTime() && due > overdueAt) {
					overdueAt = due;
				}
			}
		}
		if (overdueCount > 0) {
			items.push({
				id: "overdue",
				type: "overdue",
				count: overdueCount,
				amount: overdueAmount,
				at: new Date(overdueAt || now.getTime()).toISOString(),
			});
		}

		// 2. Absences répétées (≥ 3 en 30 j).
		const ABS_THRESHOLD = 3;
		const byStudent = new Map<string, { count: number; lastAt: number }>();
		for (const a of absents30) {
			const t = a.session.startTime.getTime();
			const cur = byStudent.get(a.studentId);
			if (cur) {
				cur.count += 1;
				if (t > cur.lastAt) cur.lastAt = t;
			} else {
				byStudent.set(a.studentId, { count: 1, lastAt: t });
			}
		}
		const flagged = [...byStudent.values()].filter(
			(v) => v.count >= ABS_THRESHOLD,
		);
		if (flagged.length > 0) {
			items.push({
				id: "absences",
				type: "absences",
				count: flagged.length,
				amount: 0,
				at: new Date(Math.max(...flagged.map((v) => v.lastAt))).toISOString(),
			});
		}

		// 3. Séances sans pointage (celles que le gérant assure lui-même).
		const lastUnmarked = unmarkedSessions[0];
		if (lastUnmarked) {
			items.push({
				id: "unmarked",
				type: "unmarked",
				count: unmarkedSessions.length,
				amount: 0,
				at: lastUnmarked.startTime.toISOString(),
			});
		}

		// 4. Nouvelles inscriptions (7 j).
		const lastStudent = newStudents[0];
		if (lastStudent) {
			items.push({
				id: "enrollment",
				type: "enrollment",
				count: newStudents.length,
				amount: 0,
				at: lastStudent.registrationDate.toISOString(),
			});
		}

		const seenMs = seenAt ? seenAt.getTime() : 0;
		const unreadCount = items.filter(
			(it) => new Date(it.at).getTime() > seenMs,
		).length;

		items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

		return { items, unreadCount, seenAt };
	},
);

export const markNotificationsSeenAction = createSafeAction(
	z.object({}),
	async (_, { tenantId, userId }) => {
		const client = getTenantPrisma(tenantId);
		await client.user.update({
			where: { id: userId },
			data: { notificationsSeenAt: new Date() },
		});
		return { ok: true };
	},
);
