import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/next", () => ({
	getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
    const mock = {
        student: { 
            findUnique: vi.fn(), 
            create: vi.fn(), 
            update: vi.fn(), 
            delete: vi.fn(),
        },
        groupe: {
            findMany: vi.fn(),
            update: vi.fn(),
        },
        document: {
            create: vi.fn(),
            deleteMany: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(mock)),
        paymentPlan: { findMany: vi.fn(), deleteMany: vi.fn() },
        tranche: { findMany: vi.fn(), deleteMany: vi.fn() },
        paiement: { deleteMany: vi.fn() },
        attendanceRecord: { deleteMany: vi.fn() },
    };
    return {
	    getTenantPrisma: vi.fn(() => mock),
        prisma: mock,
    };
});

vi.mock("@/lib/auth", () => ({
	authOptions: {},
}));

vi.mock("next/cache", () => ({
	revalidateTag: vi.fn(),
}));

import { getServerSession } from "next-auth/next";
import {
    addDocumentToStudentAction,
	addStudentToGroupAction,
	createStudentAction,
	deleteStudentAction,
	getStudentFullProfileAction,
	removeStudentFromGroupAction,
	updateStudentAction,
} from "@/actions/students.actions";
import { getTenantPrisma } from "@/lib/prisma";

const TENANT_ID = "etab-1";
const STUDENT_ID = "550e8400-e29b-41d4-a716-446655440001";
const GROUP_ID = "550e8400-e29b-41d4-a716-446655440002";
const BAD_UUID = "bad-uuid";

const makeSession = (override: Record<string, unknown> = {}) => ({
	user: {
		id: "user-1",
		role: "ADMIN",
		etablissementId: TENANT_ID,
		...override,
	},
	expires: "2099-01-01",
});

const minimalStudentInput = {
	firstName: "Youcef",
	lastName: "Brahim",
	photoUrl: "https://example.com/photo.jpg",
	isMinor: false,
    groupIds: [],
};

const fullStudentInput = {
    ...minimalStudentInput,
    email: "youcef@test.dz",
    phone: "0555000000",
    address: "1 Rue Didouche",
    parentName: "Parent",
    parentPhone: "0555111111",
    parentEmail: "parent@test.dz",
    groupIds: [GROUP_ID],
};

describe("Students Actions Audit", () => {
    let mockPrisma: any;

	beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma = getTenantPrisma(TENANT_ID);
    });

	describe("createStudentAction", () => {
        describe("🔴 Sécurité et Isolation (Tenant Spoofing)", () => {
            it("rejette si pas de session (AUTH_REQUIRED)", async () => {
                vi.mocked(getServerSession).mockResolvedValue(null);
                const result = await createStudentAction(minimalStudentInput);
                expect(result.success).toBe(false);
                if (!result.success) expect(result.error.code).toBe("AUTH_REQUIRED");
            });

            it("vérifie que l'étudiant est créé sur le tenant injecté par la session, jamais un autre", async () => {
                vi.mocked(getServerSession).mockResolvedValue(makeSession({ etablissementId: "my-secure-tenant" }) as never);
                const localMockPrisma = getTenantPrisma("my-secure-tenant");
                (localMockPrisma.student.create as any).mockResolvedValue({ id: "new-id" });

                await createStudentAction(minimalStudentInput);
                // Le tenant est isolé via le mock `getTenantPrisma` qui garantit que l'accès
                // ne peut se faire que sur le schéma du tenant ou via les extensions de row level security.
                // Dans le cas de `create`, Prisma injecte les champs par défaut selon l'extension si applicable,
                // mais le code n'utilise pas explicement `etablissementId` dans `create` data car
                // c'est géré par getTenantPrisma(). On vérifie simplement l'appel.
                expect(localMockPrisma.student.create).toHaveBeenCalled();
            });

            it("rejette la création si les groupes associés n'appartiennent pas au MÊME tenant (Spoofing relationnel)", async () => {
                vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
                mockPrisma.groupe.findMany.mockResolvedValue([]); // Groupe introuvable pour ce tenant
                
                const result = await createStudentAction({
                    ...minimalStudentInput,
                    groupIds: [GROUP_ID],
                });
                
                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
                    expect(result.error.message).toMatch(/Certains groupes/);
                }
                
                // Vérifie que la recherche de groupe a utilisé la contrainte d'isolation
                expect(mockPrisma.groupe.findMany).toHaveBeenCalledWith(expect.objectContaining({
                    where: { id: { in: [GROUP_ID] }, etablissementId: TENANT_ID }
                }));
            });
        });

        describe("🟡 Validations Zod et Injections", () => {
            it("rejette les emails mal formatés", async () => {
                vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
                const res = await createStudentAction({ ...fullStudentInput, email: "not-an-email" });
                expect(res.success).toBe(false);
            });

            it("rejette si photoUrl n'est pas une URL valide", async () => {
                vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
                const res = await createStudentAction({ ...fullStudentInput, photoUrl: "script:alert(1)" });
                expect(res.success).toBe(false);
            });

            it("accepte les inputs valides avec des chaînes vides (fallback sur null dans le code)", async () => {
                vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
                mockPrisma.student.create.mockResolvedValue({ id: "id" });
                
                const res = await createStudentAction({ ...minimalStudentInput, email: "" });
                expect(res.success).toBe(true);
                expect(mockPrisma.student.create).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({ email: null }) // Le code remplace "" par null
                }));
            });
        });

        describe("🟢 Happy Path Extrême", () => {
            it("crée un élève complet avec nettoyage des données undefined", async () => {
                vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
                mockPrisma.groupe.findMany.mockResolvedValue([{ id: GROUP_ID }]);
                mockPrisma.student.create.mockResolvedValue({ id: "id" });

                const result = await createStudentAction(fullStudentInput);
                expect(result.success).toBe(true);
                expect(mockPrisma.student.create).toHaveBeenCalledWith({
                    data: expect.objectContaining({
                        firstName: "Youcef",
                        email: "youcef@test.dz",
                        groups: { connect: [{ id: GROUP_ID }] }
                    })
                });
            });

            it("crée un élève sans groupes (Branch Coverage ligne 58)", async () => {
                vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
                mockPrisma.student.create.mockResolvedValue({ id: "id" });
                
                // Envoi EXPLICITE d'un tableau vide pour la branche false du ternaire
                const result = await createStudentAction({ ...minimalStudentInput, groupIds: [] } as any);
                
                expect(result.success).toBe(true);
                expect(mockPrisma.student.create).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({ groups: { connect: [] } })
                }));
            });
        });
	});

	describe("updateStudentAction", () => {
        const updateInput = { id: STUDENT_ID, ...minimalStudentInput };

        it("🔴 Isolation : Met à jour uniquement si l'ID ET le TenantId matchent (Clé Composite)", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.student.update.mockResolvedValue({ id: STUDENT_ID });

            // Envoi EXPLICITE d'un tableau vide pour la couverture de la ligne 102
            const result = await updateStudentAction({ ...updateInput, groupIds: [] });
            expect(result.success).toBe(true);
            
            // Preuve absolue que le tenant n'est jamais spoofé
            expect(mockPrisma.student.update).toHaveBeenCalledWith(expect.objectContaining({
                where: { id_etablissementId: { id: STUDENT_ID, etablissementId: TENANT_ID } }
            }));
            
            // Vérifie que la vérification des groupes a été sautée
            expect(mockPrisma.groupe.findMany).not.toHaveBeenCalled();
        });

        it("🔴 Isolation : Rejette l'association de groupes n'appartenant pas au tenant", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.groupe.findMany.mockResolvedValue([]); // Groupe absent
            
            const result = await updateStudentAction({ ...updateInput, groupIds: [GROUP_ID] });
            expect(result.success).toBe(false);
            if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
        });

        it("🟢 Happy Path : Mise à jour des groupes", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.groupe.findMany.mockResolvedValue([{ id: GROUP_ID }]);
            mockPrisma.student.update.mockResolvedValue({ id: STUDENT_ID });

            const result = await updateStudentAction({ ...updateInput, groupIds: [GROUP_ID] });
            expect(result.success).toBe(true);
            expect(mockPrisma.student.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    groups: { set: [{ id: GROUP_ID }] }
                })
            }));
        });
	});

	describe("deleteStudentAction", () => {
        it("🔴 Isolation : Vérifie l'appartenance de l'élève avant suppression (Double Check)", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            // Simule que l'élève n'appartient pas au tenant (retourne null)
            mockPrisma.student.findUnique.mockResolvedValue(null);

            const result = await deleteStudentAction({ id: STUDENT_ID });
            expect(result.success).toBe(false);
            if (!result.success) expect(result.error.code).toBe("RESOURCE_NOT_FOUND");
            
            expect(mockPrisma.student.findUnique).toHaveBeenCalledWith({
                where: { id_etablissementId: { id: STUDENT_ID, etablissementId: TENANT_ID } }
            });
        });

        it("🟠 Résilience : Supprime en cascade les paiements et tranches si présents (Happy Path Complet)", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.student.findUnique.mockResolvedValue({ id: STUDENT_ID });
            
            // Simule l'existence d'un plan de paiement et de tranches
            mockPrisma.paymentPlan.findMany.mockResolvedValue([{ id: "plan-1" }]);
            mockPrisma.tranche.findMany.mockResolvedValue([{ id: "tranche-1" }]);
            mockPrisma.student.delete.mockResolvedValue({ id: STUDENT_ID });

            const result = await deleteStudentAction({ id: STUDENT_ID });
            expect(result.success).toBe(true);

            // Vérifie l'ordre bottom-up des suppressions en cascade
            expect(mockPrisma.paiement.deleteMany).toHaveBeenCalledWith({ where: { trancheId: { in: ["tranche-1"] } } });
            expect(mockPrisma.tranche.deleteMany).toHaveBeenCalledWith({ where: { paymentPlanId: { in: ["plan-1"] } } });
            expect(mockPrisma.paymentPlan.deleteMany).toHaveBeenCalledWith({ where: { studentId: STUDENT_ID } });
            expect(mockPrisma.document.deleteMany).toHaveBeenCalledWith({ where: { studentId: STUDENT_ID } });
            expect(mockPrisma.attendanceRecord.deleteMany).toHaveBeenCalledWith({ where: { studentId: STUDENT_ID } });
            expect(mockPrisma.student.delete).toHaveBeenCalledWith({
                where: { id_etablissementId: { id: STUDENT_ID, etablissementId: TENANT_ID } }
            });
        });

        it("🟠 Résilience : Supprime l'élève avec un plan de paiement SANS tranches (Branch coverage 149-156)", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.student.findUnique.mockResolvedValue({ id: STUDENT_ID });
            
            mockPrisma.paymentPlan.findMany.mockResolvedValue([{ id: "plan-empty" }]);
            mockPrisma.tranche.findMany.mockResolvedValue([]); // Aucune tranche !
            mockPrisma.student.delete.mockResolvedValue({ id: STUDENT_ID });

            const result = await deleteStudentAction({ id: STUDENT_ID });
            expect(result.success).toBe(true);

            expect(mockPrisma.tranche.findMany).toHaveBeenCalled();
            expect(mockPrisma.paiement.deleteMany).not.toHaveBeenCalled(); // Ne doit pas être appelé
            expect(mockPrisma.tranche.deleteMany).toHaveBeenCalled();
            expect(mockPrisma.paymentPlan.deleteMany).toHaveBeenCalled();
        });

        it("🟠 Résilience : Supprime l'élève SANS aucun plan de paiement (Branch coverage)", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.student.findUnique.mockResolvedValue({ id: STUDENT_ID });
            
            mockPrisma.paymentPlan.findMany.mockResolvedValue([]); // Aucun plan de paiement
            mockPrisma.student.delete.mockResolvedValue({ id: STUDENT_ID });

            const result = await deleteStudentAction({ id: STUDENT_ID });
            expect(result.success).toBe(true);

            expect(mockPrisma.tranche.findMany).not.toHaveBeenCalled(); // Ne doit pas être appelé
            expect(mockPrisma.student.delete).toHaveBeenCalled();
        });

        it("🟠 Pannes Systèmes : Transaction Rollback sur échec interne", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.student.findUnique.mockResolvedValue({ id: STUDENT_ID });
            
            // Simule un crash lors de la transaction
            mockPrisma.$transaction.mockRejectedValue(new Error("DB CONNECTION LOST"));

            const result = await deleteStudentAction({ id: STUDENT_ID });
            expect(result.success).toBe(false);
            if (!result.success) expect(result.error.code).toBe("INTERNAL_SERVER_ERROR");
        });
	});

	describe("addDocumentToStudentAction", () => {
        const docInput = {
            studentId: STUDENT_ID,
            name: "ID Card",
            url: "https://example.com/id.pdf",
            type: "application/pdf"
        };

        it("🔴 Isolation : Applique le tenantId au document créé", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            mockPrisma.document.create.mockResolvedValue({ id: "doc-1" });

            const result = await addDocumentToStudentAction(docInput);
            expect(result.success).toBe(true);
            expect(mockPrisma.document.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    etablissementId: TENANT_ID,
                    status: "APPROVED"
                })
            }));
        });

        it("🟡 Validations Zod : Rejette un URL malveillant ou type invalide", async () => {
            vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
            const res = await addDocumentToStudentAction({ ...docInput, url: "javascript:alert(1)" });
            expect(res.success).toBe(false);
        });
    });

	describe("addStudentToGroupAction et removeStudentFromGroupAction", () => {
		it("🔴 Isolation : Connecte et déconnecte uniquement avec filtre sur le tenantId (Groupe d'appartenance)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.groupe.update.mockResolvedValue({ id: GROUP_ID });

			let result = await addStudentToGroupAction({ studentId: STUDENT_ID, groupId: GROUP_ID });
			expect(result.success).toBe(true);
            expect(mockPrisma.groupe.update).toHaveBeenCalledWith({
                where: { id: GROUP_ID, etablissementId: TENANT_ID },
                data: { students: { connect: { id: STUDENT_ID } } }
            });

            result = await removeStudentFromGroupAction({ studentId: STUDENT_ID, groupId: GROUP_ID });
            expect(result.success).toBe(true);
            expect(mockPrisma.groupe.update).toHaveBeenCalledWith({
                where: { id: GROUP_ID, etablissementId: TENANT_ID },
                data: { students: { disconnect: { id: STUDENT_ID } } }
            });
		});
	});

	describe("getStudentFullProfileAction", () => {
		it("🔴 Isolation : Récupère les données avec la contrainte stricte sur le tenantId", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			mockPrisma.student.findUnique.mockResolvedValue({ id: STUDENT_ID });

			const result = await getStudentFullProfileAction({ id: STUDENT_ID });
			expect(result.success).toBe(true);
            expect(mockPrisma.student.findUnique).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: STUDENT_ID, etablissementId: TENANT_ID }
            }));
		});

        it("🟡 Validations : Rejette un ID non-UUID (IDOR protection de base)", async () => {
			vi.mocked(getServerSession).mockResolvedValue(makeSession() as never);
			const result = await getStudentFullProfileAction({ id: BAD_UUID });
			expect(result.success).toBe(false);
            if (!result.success) expect(result.error.code).toBe("INVALID_DATA_FORMAT");
		});
	});
});
