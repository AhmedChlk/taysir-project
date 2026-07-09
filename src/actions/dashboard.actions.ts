"use server";

import {
	addMinutes,
	endOfDay,
	endOfMonth,
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfWeek,
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
			// Attendance over the last 7 days → présence moyenne.
			client.attendanceRecord.findMany({
				where: { session: { startTime: { gte: weekSince, lte: now } } },
				select: { status: true },
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

		// Séances passées sans pointage saisi (gap opérationnel à combler).
		const sansPointage = weekSessions.filter((s) => s._count.attendance === 0);

		return {
			students: { total: totalStudents, active: activeStudents },
			staffCount,
			finance: { encaisseCeMois, resteARecouvrer, tauxRecouvrement },
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
