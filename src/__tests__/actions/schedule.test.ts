import { describe, expect, it } from "vitest";
import { CreateSessionSchema } from "@/lib/validations";

describe("CreateSessionSchema — validation des données de planning (SEC-04)", () => {
	const validSession = {
		activityId: "550e8400-e29b-41d4-a716-446655440004",
		roomId: "550e8400-e29b-41d4-a716-446655440001",
		instructorId: "550e8400-e29b-41d4-a716-446655440002",
		groupId: "550e8400-e29b-41d4-a716-446655440003",
		startTime: new Date("2026-09-01T09:00:00Z"),
		endTime: new Date("2026-09-01T11:00:00Z"),
	};

	it("accepte une session valide", () => {
		const result = CreateSessionSchema.safeParse(validSession);
		expect(result.success).toBe(true);
	});

	it("rejette si endTime <= startTime (conflit temporel)", () => {
		const result = CreateSessionSchema.safeParse({
			...validSession,
			endTime: new Date("2026-09-01T08:00:00Z"),
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((issue) => issue.path.join("."));
			expect(paths).toContain("endTime");
		}
	});

	it("rejette si endTime est identique à startTime", () => {
		const result = CreateSessionSchema.safeParse({
			...validSession,
			endTime: new Date("2026-09-01T09:00:00Z"),
		});
		expect(result.success).toBe(false);
	});

	it("rejette un roomId non-UUID", () => {
		const result = CreateSessionSchema.safeParse({
			...validSession,
			roomId: "invalid-room-id",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((issue) => issue.path.join("."));
			expect(paths).toContain("roomId");
		}
	});

	it("rejette un instructorId non-UUID", () => {
		const result = CreateSessionSchema.safeParse({
			...validSession,
			instructorId: "not-a-uuid",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((issue) => issue.path.join("."));
			expect(paths).toContain("instructorId");
		}
	});

	it("rejette un groupId non-UUID", () => {
		const result = CreateSessionSchema.safeParse({
			...validSession,
			groupId: "not-a-uuid",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((issue) => issue.path.join("."));
			expect(paths).toContain("groupId");
		}
	});

	it("rejette un activityId non-UUID", () => {
		const result = CreateSessionSchema.safeParse({
			...validSession,
			activityId: "not-a-uuid",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const paths = result.error.issues.map((issue) => issue.path.join("."));
			expect(paths).toContain("activityId");
		}
	});

	it("rejette si startTime est absent", () => {
		const { startTime: _omitted, ...withoutStartTime } = validSession;
		const result = CreateSessionSchema.safeParse(withoutStartTime);
		expect(result.success).toBe(false);
	});

	it("rejette si endTime est absent", () => {
		const { endTime: _omitted, ...withoutEndTime } = validSession;
		const result = CreateSessionSchema.safeParse(withoutEndTime);
		expect(result.success).toBe(false);
	});
});
