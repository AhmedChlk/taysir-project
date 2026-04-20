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
	deleteTenantAction,
} from "@/actions/superadmin.actions";
import { prisma } from "@/lib/prisma";

const TEST_MANAGER_PASSWORD = process.env.TEST_PASSWORD as string;

const makeSuperAdminSession = () => ({
	user: {
		id: "superadmin-1",
		role: "SUPER_ADMIN",
	},
	expires: "2099-01-01",
});

const makeManagerSession = () => ({
	user: {
		id: "manager-1",
		role: "GERANT",
		etablissementId: "etab-1",
	},
	expires: "2099-01-01",
});

describe("SuperAdmin Actions", () => {
	beforeEach(() => {
        vi.clearAllMocks();
    });

	describe("getAllTenantsAction", () => {
		it("retourne tous les établissements si SUPER_ADMIN", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSuperAdminSession() as never);
			const tenants = [{ id: "t1", name: "Etab 1" }];
			vi.mocked(prisma.etablissement.findMany).mockResolvedValue(tenants as any);

			const result = await getAllTenantsAction({});
			expect(result.success).toBe(true);
			if (result.success) expect(result.data).toEqual(tenants);
		});

		it("rejette si non SUPER_ADMIN", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeManagerSession() as never);
			const result = await getAllTenantsAction({});
			expect(result.success).toBe(false);
			if (!result.success) expect(result.error.code).toBe("FORBIDDEN_ACCESS");
		});
	});

	describe("createTenantAction", () => {
		const tenantData = {
			name: "Nouvelle École",
			slug: "nouvelle-ecole",
			primaryColor: "#FF5733",
			manager: {
				email: "admin@nouvelle.com",
				firstName: "Ahmed",
				lastName: "Ben",
				password: TEST_MANAGER_PASSWORD,
			}
		};

		it("crée un établissement et son gérant en transaction", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSuperAdminSession() as never);
			vi.mocked(prisma.etablissement.findUnique).mockResolvedValue(null);
			vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
			
			const mockTenant = { id: "new-etab-id", ...tenantData };
			const mockManager = { id: "new-user-id", email: tenantData.manager.email };
			
			vi.mocked(prisma.etablissement.create).mockResolvedValue(mockTenant as any);
			vi.mocked(prisma.user.create).mockResolvedValue(mockManager as any);

			const result = await createTenantAction(tenantData);
			
			expect(result.success).toBe(true);
			expect(prisma.etablissement.create).toHaveBeenCalled();
			expect(prisma.user.create).toHaveBeenCalled();
		});

		it("rejette si le slug existe déjà", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSuperAdminSession() as never);
			vi.mocked(prisma.etablissement.findUnique).mockResolvedValue({ id: "exist" } as any);

			const result = await createTenantAction(tenantData);
			expect(result.success).toBe(false);
		});
	});

	describe("toggleTenantStatusAction", () => {
		it("active ou désactive un établissement", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSuperAdminSession() as never);
			const tenantId = "550e8400-e29b-41d4-a716-446655440001";
			vi.mocked(prisma.etablissement.update).mockResolvedValue({ id: tenantId, isActive: false } as any);

			const result = await toggleTenantStatusAction({ id: tenantId, isActive: false });
			expect(result.success).toBe(true);
			expect(prisma.etablissement.update).toHaveBeenCalledWith({
				where: { id: tenantId },
				data: { isActive: false }
			});
		});
	});

	describe("deleteTenantAction", () => {
		it("supprime un établissement", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSuperAdminSession() as never);
			const tenantId = "550e8400-e29b-41d4-a716-446655440001";
			vi.mocked(prisma.etablissement.delete).mockResolvedValue({ id: tenantId } as any);

			const result = await deleteTenantAction({ id: tenantId });
			expect(result.success).toBe(true);
			expect(prisma.etablissement.delete).toHaveBeenCalledWith({
				where: { id: tenantId }
			});
		});
	});
});
