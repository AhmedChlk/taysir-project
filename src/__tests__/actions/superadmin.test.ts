import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
    const mock = {
        etablissement: { 
            findUnique: vi.fn(), 
            findMany: vi.fn(), 
            create: vi.fn(), 
            update: vi.fn(), 
            delete: vi.fn(),
            count: vi.fn(),
        },
        user: { 
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(mock)),
    };
    return {
	    prisma: mock,
    };
});

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
    unstable_cache: vi.fn((fn) => fn),
}));

vi.mock("bcryptjs", () => ({
	hash: vi.fn().mockResolvedValue("hashed-password-123"),
    compare: vi.fn().mockResolvedValue(true),
}));

import { getServerSession } from "next-auth/next";
import {
	getAllTenantsAction,
	createTenantAction,
	toggleTenantStatusAction,
    updateTenantAction,
	deleteTenantAction,
} from "@/actions/superadmin.actions";
import { prisma } from "@/lib/prisma";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440001";

const makeSession = (role: string, etablissementId?: string) => ({
	user: {
		id: "test-user-id",
		role: role,
        etablissementId: etablissementId
	},
	expires: "2099-01-01",
});

describe("SuperAdmin Actions Audit", () => {
	beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("🔴 Le Mur de Feu (Privilege Escalation)", () => {
        const forbiddenRoles = ["ADMIN", "GERANT", "STAFF", "STUDENT"];
        
        it.each(forbiddenRoles)("rejette l'accès si le rôle est %s", async (role) => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession(role, "some-etab") as never);
            
            const results = await Promise.all([
                getAllTenantsAction({}),
                createTenantAction({
                    name: "Test",
                    slug: "test",
                    manager: { email: "a@b.com", firstName: "A", lastName: "B", password: process.env.TEST_PASSWORD || "password123" }
                }),
                toggleTenantStatusAction({ id: VALID_UUID, isActive: true }),
                updateTenantAction({ id: VALID_UUID }),
                deleteTenantAction({ id: VALID_UUID })
            ]);

            for (const res of results) {
                expect(res.success).toBe(false);
            }
        });
    });

	describe("getAllTenantsAction", () => {
		it("🟢 Accès Global: récupère tous les établissements", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
			vi.mocked(prisma.etablissement.findMany).mockResolvedValue([]);

			await getAllTenantsAction({});
			expect(prisma.etablissement.findMany).toHaveBeenCalled();
		});

        it("🟠 Pannes Systèmes: gère une erreur Prisma", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            vi.mocked(prisma.etablissement.findMany).mockRejectedValue(new Error("CRASH"));

            const result = await getAllTenantsAction({});
            expect(result.success).toBe(false);
        });
	});

	describe("createTenantAction", () => {
		const validData = {
			name: "Test School",
			slug: "Test School",
			primaryColor: "#aabbcc",
			manager: {
				email: "manager@test.com",
				firstName: "John",
				lastName: "Doe",
				password: process.env.TEST_PASSWORD || "password123",
			}
		};

		it("Happy Path Extrême: création réussie avec contractEndDate", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
			vi.mocked(prisma.etablissement.findUnique).mockResolvedValue(null);
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
			vi.mocked(prisma.etablissement.create).mockResolvedValue({ id: "etab-1" } as any);

			const result = await createTenantAction({ ...validData, contractEndDate: "2030-01-01" });
			expect(result.success).toBe(true);
            expect(prisma.etablissement.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ 
                    contractEndDate: expect.any(Date),
                    primaryColor: "#aabbcc"
                })
            }));
		});

        it("Happy Path: création avec valeurs par défaut (no color, no contract)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            const { primaryColor, ...minimalData } = validData;
			vi.mocked(prisma.etablissement.findUnique).mockResolvedValue(null);
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

			await createTenantAction(minimalData as any);
            expect(prisma.etablissement.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ 
                    primaryColor: "#0F515C",
                    contractEndDate: null
                })
            }));
        });

        it("rejette si slug déjà pris", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            vi.mocked(prisma.etablissement.findUnique).mockResolvedValue({ id: "exist" } as any);
            
            const result = await createTenantAction(validData);
            expect(result.success).toBe(false);
            if (!result.success) expect(result.error.message).toBe("Ce slug est déjà utilisé.");
        });

        it("rejette si email déjà pris", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            vi.mocked(prisma.etablissement.findUnique).mockResolvedValue(null);
            vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1" } as any);

            const result = await createTenantAction(validData);
            expect(result.success).toBe(false);
            if (!result.success) expect(result.error.message).toBe("Un utilisateur possède déjà cet email.");
        });
	});

	describe("updateTenantAction", () => {
		it("gère contractEndDate et mise à jour partielle", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            vi.mocked(prisma.etablissement.update).mockResolvedValue({} as any);

			const result = await updateTenantAction({ id: VALID_UUID, contractEndDate: "2030-01-01", name: "New" });
			expect(result.success).toBe(true);
            expect(prisma.etablissement.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ contractEndDate: expect.any(Date), name: "New" })
            }));
		});

        it("gère la mise à jour sans contractEndDate", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            await updateTenantAction({ id: VALID_UUID, name: "No Date" });
            expect(prisma.etablissement.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.not.objectContaining({ contractEndDate: expect.anything() })
            }));
        });
	});

    describe("toggle et delete", () => {
        it("toggle avec succès", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            await toggleTenantStatusAction({ id: VALID_UUID, isActive: false });
            expect(prisma.etablissement.update).toHaveBeenCalled();
        });

        it("delete avec succès", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession("SUPER_ADMIN") as never);
            await deleteTenantAction({ id: VALID_UUID });
            expect(prisma.etablissement.delete).toHaveBeenCalled();
        });
    });
});
