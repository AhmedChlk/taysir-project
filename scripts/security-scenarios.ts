/**
 * Scénarios de sécurité — isolation multi-tenant & IDOR.
 *
 * S'exécute sur la base peuplée par `npm run db:seed:massive`. Chaque scénario
 * tente une attaque plausible (lecture/écriture cross-tenant, usurpation de
 * client global, IDOR par ID d'une autre école) et vérifie que l'isolation
 * imposée par `getTenantPrisma` la bloque. Sort en code 1 si un scénario échoue.
 *
 * Lancement :  npm run security:scenarios
 */

import { PrismaClient } from "@prisma/client";
// Import relatif (pas d'alias @/) pour rester exécutable via ts-node hors Next.
import { getTenantPrisma } from "../src/lib/prisma";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;
const results: { scenario: string; ok: boolean; detail: string }[] = [];

function check(scenario: string, ok: boolean, detail: string) {
	results.push({ scenario, ok, detail });
	if (ok) passed++;
	else failed++;
	console.log(`${ok ? "✅" : "❌"} ${scenario} — ${detail}`);
}

async function expectThrow(
	scenario: string,
	fn: () => Promise<unknown>,
	detail: string,
) {
	try {
		await fn();
		check(scenario, false, `${detail} (aucune exception levée !)`);
	} catch {
		check(scenario, true, detail);
	}
}

async function main() {
	console.log("🔐 Scénarios de sécurité — isolation multi-tenant\n");

	const etabs = await prisma.etablissement.findMany({
		select: { id: true, name: true },
		orderBy: { createdAt: "asc" },
		take: 5,
	});
	if (etabs.length < 2) {
		console.error(
			"❌ Il faut au moins 2 écoles. Lancez d'abord `npm run db:seed:massive`.",
		);
		process.exit(1);
	}
	const A = etabs[0]!;
	const B = etabs[1]!;
	const clientA = getTenantPrisma(A.id);
	const clientB = getTenantPrisma(B.id);
	console.log(`École A = ${A.name}\nÉcole B = ${B.name}\n`);

	// Données de référence côté B (la "cible" d'une attaque menée depuis A).
	const bStudent = await clientB.student.findFirst({
		select: { id: true, lastName: true },
	});
	const bPlan = await clientB.paymentPlan.findFirst({ select: { id: true } });
	const bTranche = await clientB.tranche.findFirst({ select: { id: true } });
	const bSession = await clientB.session.findFirst({ select: { id: true } });
	const bUser = await clientB.user.findFirst({ select: { id: true } });
	if (!bStudent || !bPlan || !bTranche || !bSession || !bUser) {
		console.error("❌ École B incomplète — reseedez.");
		process.exit(1);
	}

	// --- 1. Lecture cross-tenant par ID (IDOR) : A lit un élève de B ----------
	const leakStudent = await clientA.student.findFirst({
		where: { id: bStudent.id },
	});
	check(
		"IDOR lecture élève",
		leakStudent === null,
		"A ne peut pas lire l'élève de B par son ID",
	);

	const leakPlan = await clientA.paymentPlan.findFirst({
		where: { id: bPlan.id },
	});
	check(
		"IDOR lecture échéancier",
		leakPlan === null,
		"A ne voit pas l'échéancier de B",
	);

	const leakTranche = await clientA.tranche.findFirst({
		where: { id: bTranche.id },
	});
	check(
		"IDOR lecture tranche",
		leakTranche === null,
		"A ne voit pas la tranche de B",
	);

	const leakSession = await clientA.session.findFirst({
		where: { id: bSession.id },
	});
	check(
		"IDOR lecture séance",
		leakSession === null,
		"A ne voit pas la séance de B",
	);

	const leakUser = await clientA.user.findFirst({ where: { id: bUser.id } });
	check(
		"IDOR lecture staff",
		leakUser === null,
		"A ne voit pas le personnel de B",
	);

	// --- 2. Écriture cross-tenant (IDOR mutation) : A modifie un élève de B ----
	const hijack = await clientA.student.updateMany({
		where: { id: bStudent.id },
		data: { lastName: "PIRATE" },
	});
	const stillIntact = await clientB.student.findFirst({
		where: { id: bStudent.id },
	});
	check(
		"IDOR écriture élève",
		hijack.count === 0 && stillIntact?.lastName === bStudent.lastName,
		`updateMany depuis A a touché ${hijack.count} ligne(s) ; nom de B inchangé`,
	);

	// --- 3. Suppression cross-tenant : A supprime un élève de B ----------------
	const del = await clientA.student.deleteMany({ where: { id: bStudent.id } });
	const stillThere = await clientB.student.findFirst({
		where: { id: bStudent.id },
	});
	check(
		"IDOR suppression élève",
		del.count === 0 && stillThere !== null,
		`deleteMany depuis A a supprimé ${del.count} ligne(s) ; élève de B toujours présent`,
	);

	// --- 4. Homonymes : même nom dans A et B, aucun recoupement d'ID -----------
	const target = bStudent.lastName;
	const inA = await clientA.student.findMany({
		where: { lastName: target },
		select: { id: true, etablissementId: true },
	});
	const inB = await clientB.student.findMany({
		where: { lastName: target },
		select: { id: true, etablissementId: true },
	});
	const aAllA = inA.every((s) => s.etablissementId === A.id);
	const bAllB = inB.every((s) => s.etablissementId === B.id);
	const disjoint = !inA.some((s) => inB.find((x) => x.id === s.id));
	check(
		"Isolation homonymes",
		aAllA && bAllB && disjoint,
		`nom "${target}" : ${inA.length} chez A / ${inB.length} chez B, ensembles disjoints`,
	);

	// --- 5. Agrégats : somme par tenant == total global -----------------------
	const globalCount = await prisma.student.count();
	let perTenantSum = 0;
	const allEtabs = await prisma.etablissement.findMany({
		select: { id: true },
	});
	for (const e of allEtabs) {
		perTenantSum += await getTenantPrisma(e.id).student.count();
	}
	check(
		"Cohérence agrégats",
		globalCount === perTenantSum,
		`total global ${globalCount} == somme par tenant ${perTenantSum}`,
	);

	// --- 6. Fuite via count : A.count ne compte que ses élèves ----------------
	const aCount = await clientA.student.count();
	const aRealCount = await prisma.student.count({
		where: { etablissementId: A.id },
	});
	check(
		"Count scoping",
		aCount === aRealCount && aCount < globalCount,
		`A.count = ${aCount} (réel ${aRealCount}), < global ${globalCount}`,
	);

	// --- 7. Client SUPER_ADMIN (GLOBAL_ACCESS) : bloque les modèles tenant ----
	const globalClient = getTenantPrisma("GLOBAL_ACCESS");
	await expectThrow(
		"GLOBAL_ACCESS bloque student",
		() => globalClient.student.findMany(),
		"lecture d'un modèle tenant refusée au client global",
	);
	// ... mais autorise le modèle Etablissement.
	const etabOk = await globalClient.etablissement.findMany({
		select: { id: true },
	});
	check(
		"GLOBAL_ACCESS autorise Etablissement",
		Array.isArray(etabOk) && etabOk.length >= 2,
		`client global lit ${etabOk.length} établissements`,
	);

	// --- 8. Tenant vide interdit ----------------------------------------------
	await expectThrow(
		"Tenant vide rejeté",
		async () => getTenantPrisma("").student.findMany(),
		"getTenantPrisma('') lève une erreur",
	);

	// --- 9. Injection etablissementId falsifié dans le where -------------------
	// Même si l'appelant tente de forcer un autre etablissementId, l'extension
	// l'écrase par celui du tenant courant (dernier gagne).
	const spoof = await clientA.student.findMany({
		where: { etablissementId: B.id },
		select: { id: true, etablissementId: true },
	});
	const noBLeak = spoof.every((s) => s.etablissementId === A.id);
	check(
		"Anti-spoof etablissementId",
		noBLeak,
		`where falsifié (etablissementId=B) neutralisé : ${spoof.length} résultat(s), tous chez A`,
	);

	// -------------------------------------------------------------- résumé -----
	console.log("\n────────────────────────────────────────");
	console.log(`Résultat : ${passed} réussis, ${failed} échoués`);
	if (failed > 0) {
		console.log("\nÉchecs :");
		for (const r of results.filter((r) => !r.ok)) {
			console.log(`  ❌ ${r.scenario} — ${r.detail}`);
		}
	}
	process.exit(failed > 0 ? 1 : 0);
}

main()
	.catch((e) => {
		console.error("❌ Erreur scénarios :", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
