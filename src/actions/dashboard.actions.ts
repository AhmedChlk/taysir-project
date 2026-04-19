"use server";

import {
	addMinutes,
	eachDayOfInterval,
	endOfDay,
	endOfWeek,
	isSameDay,
	startOfDay,
	startOfWeek,
} from "date-fns";
import { z } from "zod";
import { createSafeAction } from "@/lib/actions/safe-action";
import { getTenantPrisma } from "@/lib/prisma";

export const getDashboardStatsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);

		const [totalStudents, activeStudents] = await Promise.all([
			client.student.count(),
			client.student.count({ where: { isActive: true } }),
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

		const totalPendingAmount = pendingPlans.reduce(
			(acc: number, plan: { totalAmount: number; paidAmount: number }) =>
				acc + (plan.totalAmount - plan.paidAmount),
			0,
		);

		return {
			count: pendingPlans.length,
			totalAmount: totalPendingAmount,
			plans: pendingPlans,
		};
	},
);

export const getAttendanceStatsAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();
		const start = startOfWeek(now, { weekStartsOn: 1 });
		const end = endOfWeek(now, { weekStartsOn: 1 });

		const records = await client.attendanceRecord.findMany({
			where: {
				session: {
					startTime: { gte: start, lte: end },
				},
			},
			select: {
				status: true,
				session: { select: { startTime: true } },
			},
		});

		const days = eachDayOfInterval({ start, end });

		return days.map((day) => {
			const dayRecords = records.filter((r: { session: { startTime: Date } }) =>
				isSameDay(r.session.startTime, day),
			);
			if (dayRecords.length === 0) return 0;

			const presentCount = dayRecords.filter(
				(r: { status: string }) =>
					r.status === "PRESENT" || r.status === "RETARD",
			).length;

			return Math.round((presentCount / dayRecords.length) * 100);
		});
	},
);

export const getRoomOccupancyAction = createSafeAction(
	z.object({}),
	async (_, { tenantId }) => {
		const client = getTenantPrisma(tenantId);
		const now = new Date();

		const [totalRooms, activeSessions] = await Promise.all([
			client.room.count(),
			client.session.count({
				where: {
					startTime: { lte: now },
					endTime: { gte: now },
					status: "SCHEDULED",
				},
			}),
		]);

		return {
			totalRooms,
			occupiedRooms: activeSessions,
			rate:
				totalRooms > 0 ? Math.round((activeSessions / totalRooms) * 100) : 0,
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
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const monthlyPayments = await client.paiement.findMany({
			where: {
				date: {
					gte: startOfMonth,
					lte: endOfMonth,
				},
			},
			select: { amount: true },
		});

		const totalRevenue = monthlyPayments.reduce(
			(acc: number, p: { amount: number }) => acc + p.amount,
			0,
		);

		return {
			monthlyRevenue: totalRevenue,
			currency: "DZD",
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
			client.room.findMany({ orderBy: { name: "asc" } }),
			client.activity.findMany({ orderBy: { name: "asc" } }),
			client.user.findMany({
				where: { role: { in: ["INTERVENANT", "GERANT", "ADMIN"] } },
				orderBy: { lastName: "asc" },
			}),
			client.groupe.findMany({ orderBy: { name: "asc" } }),
			client.student.findMany({
				where: { isActive: true },
				orderBy: { lastName: "asc" },
			}),
			client.session.findMany({
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
						select: { firstName: true, lastName: true, avatarUrl: true },
					},
				},
				orderBy: { startTime: "asc" },
			}),
			client.paymentPlan.findMany({
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
			}),
		]);

		return {
			rooms,
			activities,
			staff,
			groups,
			students,
			todaySessions,
			pendingPayments,
			totalPendingAmount: pendingPayments.reduce(
				(acc: number, plan: { totalAmount: number; paidAmount: number }) =>
					acc + (plan.totalAmount - plan.paidAmount),
				0,
			),
		};
	},
);
