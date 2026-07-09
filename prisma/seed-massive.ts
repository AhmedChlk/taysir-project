/**
 * Seed massif de charge & sécurité.
 *
 * Génère un grand nombre d'établissements (par défaut 50), chacun peuplé
 * d'acteurs et de données réalistes (gérant, secrétaires, intervenants, salles,
 * activités, groupes, élèves, échéanciers + paiements, séances + présences).
 *
 * Objectifs :
 *  1. Charge — vérifier le comportement du dashboard / superadmin à l'échelle.
 *  2. Isolation multi-tenant — les NOMS de personnes se recoupent volontairement
 *     entre écoles (mêmes noms d'élèves / profs, cas réel du marché algérien où
 *     un prof intervient dans plusieurs écoles), mais chaque enregistrement est
 *     distinct et rattaché à un seul `etablissementId`, avec un email unique.
 *     Les scénarios de sécurité (scripts/security-scenarios.ts) s'appuient sur ce
 *     recoupement pour prouver qu'une école ne voit jamais les données d'une
 *     autre malgré les homonymes.
 *
 * Lancement :  npm run db:seed:massive
 * Config via env : SEED_SCHOOLS, SEED_STUDENTS_PER, SEED_INSTRUCTORS_PER, ...
 */

import {
	type NiveauScolaire,
	PrismaClient,
	RoleUser,
	type StatusPaymentPlan,
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ------------------------------------------------------------------ config ---
const cfg = {
	schools: num(process.env.SEED_SCHOOLS, 50),
	roomsPer: num(process.env.SEED_ROOMS_PER, 6),
	activitiesPer: num(process.env.SEED_ACTIVITIES_PER, 6),
	groupsPer: num(process.env.SEED_GROUPS_PER, 8),
	instructorsPer: num(process.env.SEED_INSTRUCTORS_PER, 8),
	secretariesPer: num(process.env.SEED_SECRETARIES_PER, 2),
	studentsPer: num(process.env.SEED_STUDENTS_PER, 40),
	sessionsPerGroup: num(process.env.SEED_SESSIONS_PER_GROUP, 4),
	// Mot de passe commun à tous les comptes de démo.
	password: process.env.SEED_MASSIVE_PASSWORD || "Taysir2026!",
	// Traitement par lots pour ménager la mémoire / le pool de connexions.
	batch: num(process.env.SEED_BATCH, 40),
};

function num(v: string | undefined, def: number): number {
	const n = v ? Number.parseInt(v, 10) : Number.NaN;
	return Number.isFinite(n) && n > 0 ? n : def;
}

// -------------------------------------------------------------- name pools ---
// Prénoms / noms algériens courants. Partagés entre écoles → homonymes voulus.
const FIRST_M = [
	"Mohamed",
	"Amine",
	"Yacine",
	"Bilal",
	"Riad",
	"Karim",
	"Sofiane",
	"Islam",
	"Anis",
	"Oussama",
	"Nabil",
	"Walid",
	"Hamza",
	"Zaki",
	"Adel",
];
const FIRST_F = [
	"Amina",
	"Nour",
	"Lina",
	"Sara",
	"Manel",
	"Ines",
	"Hana",
	"Yasmine",
	"Meriem",
	"Rania",
	"Chaima",
	"Kenza",
	"Wissam",
	"Selma",
	"Douaa",
];
const LAST = [
	"Benali",
	"Boumediene",
	"Haddad",
	"Cherif",
	"Belkacem",
	"Mansouri",
	"Zerrouki",
	"Bouzid",
	"Hamidi",
	"Saidi",
	"Meziane",
	"Ferhat",
	"Bouras",
	"Khelifi",
	"Talbi",
	"Rahmani",
	"Slimani",
	"Ould Ali",
	"Gacem",
	"Brahimi",
];
const CITIES = [
	"Alger",
	"Oran",
	"Constantine",
	"Annaba",
	"Blida",
	"Sétif",
	"Batna",
	"Tlemcen",
	"Béjaïa",
	"Tizi Ouzou",
];
const SUBJECTS = [
	"Mathématiques",
	"Physique",
	"Français",
	"Anglais",
	"Arabe",
	"Sciences",
	"Informatique",
	"Histoire-Géo",
	"Philosophie",
	"Soutien Primaire",
];
const NIVEAUX: NiveauScolaire[] = [
	"AP1",
	"AP2",
	"AP3",
	"AP4",
	"AP5",
	"AM1",
	"AM2",
	"AM3",
	"AM4",
	"AS1",
	"AS2",
	"AS3",
];

const pick = <T>(a: T[], i: number): T => a[i % a.length] as T;
const rand = (n: number) => Math.floor(Math.random() * n);
const randPick = <T>(a: T[]): T => a[rand(a.length)] as T;

const phone = () =>
	`0${randPick([5, 6, 7])}${String(rand(100000000)).padStart(8, "0")}`;

// --------------------------------------------------------------- one school ---
async function seedSchool(index: number, passwordHash: string) {
	const city = pick(CITIES, index);
	const slug = `ecole-${index + 1}-${city.toLowerCase().replace(/[^a-z]/g, "")}`;
	const etab = await prisma.etablissement.create({
		data: {
			name: `Centre de Soutien ${city} ${index + 1}`,
			slug,
			address: `${1 + rand(200)} Rue de ${city}, ${city}`,
			primaryColor: randPick(["#0F515C", "#1A2F23", "#8B5E34", "#2A4D69"]),
		},
	});
	const etablissementId = etab.id;

	// --- utilisateurs : 1 gérant, N secrétaires, M intervenants ---------------
	const users: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
		role: RoleUser;
		etablissementId: string;
		salary: number | null;
	}[] = [];

	users.push({
		email: `gerant.ecole${index + 1}@taysir.dz`,
		password: passwordHash,
		firstName: randPick(FIRST_M),
		lastName: randPick(LAST),
		role: RoleUser.GERANT,
		etablissementId,
		salary: 80000 + rand(40) * 1000,
	});
	for (let s = 0; s < cfg.secretariesPer; s++) {
		users.push({
			email: `secretaire${s + 1}.ecole${index + 1}@taysir.dz`,
			password: passwordHash,
			firstName: randPick(FIRST_F),
			lastName: randPick(LAST),
			role: RoleUser.SECRETAIRE,
			etablissementId,
			salary: 35000 + rand(15) * 1000,
		});
	}
	for (let p = 0; p < cfg.instructorsPer; p++) {
		users.push({
			email: `prof${p + 1}.ecole${index + 1}@taysir.dz`,
			password: passwordHash,
			firstName: randPick([...FIRST_M, ...FIRST_F]),
			lastName: randPick(LAST),
			role: RoleUser.INTERVENANT,
			etablissementId,
			salary: 45000 + rand(30) * 1000,
		});
	}
	await prisma.user.createMany({ data: users });
	const instructors = await prisma.user.findMany({
		where: { etablissementId, role: RoleUser.INTERVENANT },
		select: { id: true },
	});

	// --- salles ---------------------------------------------------------------
	await prisma.room.createMany({
		data: Array.from({ length: cfg.roomsPer }, (_, r) => ({
			name: `Salle ${101 + r}`,
			capacity: 10 + rand(20),
			etablissementId,
		})),
	});
	const rooms = await prisma.room.findMany({
		where: { etablissementId },
		select: { id: true },
	});

	// --- activités (matières) -------------------------------------------------
	await prisma.activity.createMany({
		data: Array.from({ length: cfg.activitiesPer }, (_, a) => ({
			name: pick(SUBJECTS, a),
			duration: randPick([60, 90, 120]),
			etablissementId,
		})),
	});
	const activities = await prisma.activity.findMany({
		where: { etablissementId },
		select: { id: true },
	});

	// --- groupes --------------------------------------------------------------
	await prisma.groupe.createMany({
		data: Array.from({ length: cfg.groupsPer }, (_, g) => ({
			name: `Groupe ${String.fromCharCode(65 + (g % 26))}${1 + Math.floor(g / 26)}`,
			etablissementId,
		})),
	});
	const groups = await prisma.groupe.findMany({
		where: { etablissementId },
		select: { id: true },
	});

	// --- élèves + rattachement à un groupe ------------------------------------
	const studentRows = Array.from({ length: cfg.studentsPer }, (_, s) => {
		const female = Math.random() < 0.5;
		const firstName = female ? randPick(FIRST_F) : randPick(FIRST_M);
		const lastName = randPick(LAST);
		const minor = Math.random() < 0.7;
		return {
			firstName,
			lastName,
			email: `eleve${s + 1}.ecole${index + 1}@mail.dz`,
			phone: phone(),
			isMinor: minor,
			parentName: minor ? `${randPick(FIRST_M)} ${lastName}` : null,
			parentPhone: minor ? phone() : null,
			address: `${1 + rand(200)} Cité ${city}`,
			niveau: randPick(NIVEAUX),
			etablissementId,
		};
	});
	await prisma.student.createMany({ data: studentRows });
	const students = await prisma.student.findMany({
		where: { etablissementId },
		select: { id: true },
	});

	// Rattachement m2m implicite (_GroupeToStudent) : chaque élève dans 1 groupe.
	await Promise.all(
		students.map((st, i) =>
			prisma.groupe.update({
				where: { id: pick(groups, i).id },
				data: { students: { connect: { id: st.id } } },
			}),
		),
	);

	// --- échéanciers + tranches + paiements (imbriqués) -----------------------
	// 3 scénarios : ~35% soldé, ~35% partiel, ~30% en attente.
	await runBatched(students, cfg.batch, (st, i) => {
		const activityId = pick(activities, i).id;
		const total = randPick([12000, 18000, 24000, 30000, 36000]);
		const trancheAmount = Math.round(total / 3);
		const roll = Math.random();
		const paidTranches = roll < 0.35 ? 3 : roll < 0.7 ? randPick([1, 2]) : 0;
		const status: StatusPaymentPlan =
			paidTranches === 3 ? "PAID" : paidTranches > 0 ? "PARTIAL" : "PENDING";
		const paidAmount = paidTranches * trancheAmount;

		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;
		return prisma.paymentPlan.create({
			data: {
				studentId: st.id,
				activityId,
				etablissementId,
				currency: "DZD",
				totalAmount: total,
				paidAmount,
				status,
				tranches: {
					create: [0, 1, 2].map((t) => {
						const isPaid = t < paidTranches;
						// Échéances : passées pour les premières, futures ensuite.
						const dueDate = new Date(now + (t - 1) * 30 * day);
						return {
							amount: trancheAmount,
							dueDate,
							isPaid,
							etablissementId,
							...(isPaid
								? {
										paiements: {
											create: {
												amount: trancheAmount,
												method: randPick(["CASH", "TRANSFER", "CARD"] as const),
												date: new Date(now - (paidTranches - t) * 15 * day),
												etablissementId,
											},
										},
									}
								: {}),
						};
					}),
				},
			},
		});
	});

	// --- séances + présences --------------------------------------------------
	// Pour chaque groupe : quelques séances passées (avec présences) + à venir.
	const groupStudents = await prisma.groupe.findMany({
		where: { etablissementId },
		select: { id: true, students: { select: { id: true } } },
	});
	await runBatched(groupStudents, cfg.batch, (grp, gi) => {
		const instructorId = pick(instructors, gi).id;
		const roomId = pick(rooms, gi).id;
		const activityId = pick(activities, gi).id;
		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;

		// Horaire de base propre au groupe → les cours s'étalent sur la journée
		// (8h–17h) au lieu de s'empiler tous au même créneau (calendrier lisible).
		const baseHour = 8 + (gi % 10);
		const baseMin = (gi % 2) * 30;

		return Promise.all(
			Array.from({ length: cfg.sessionsPerGroup }, (_, k) => {
				// La moitié dans le passé (présences saisies), la moitié à venir.
				const past = k < cfg.sessionsPerGroup / 2;
				// Chaque séance un jour distinct + léger décalage par groupe.
				const magnitude = (k + 1) * 2 + (gi % 3);
				const signedDays = past ? -magnitude : magnitude;
				const start = new Date(now + signedDays * day);
				start.setHours(baseHour, baseMin, 0, 0);
				const end = new Date(start.getTime() + 90 * 60 * 1000);
				return prisma.session.create({
					data: {
						startTime: start,
						endTime: end,
						status: past ? "COMPLETED" : "SCHEDULED",
						activityId,
						roomId,
						instructorId,
						groupId: grp.id,
						etablissementId,
						...(past && grp.students.length > 0
							? {
									attendance: {
										create: grp.students.map((s) => ({
											studentId: s.id,
											etablissementId,
											status: randPick([
												"PRESENT",
												"PRESENT",
												"PRESENT",
												"ABSENT",
												"RETARD",
												"JUSTIFIE",
											] as const),
										})),
									},
								}
							: {}),
					},
				});
			}),
		);
	});

	return { etablissementId, slug };
}

/** Exécute `fn` sur chaque item par lots de `size` (limite la concurrence). */
async function runBatched<T>(
	items: T[],
	size: number,
	fn: (item: T, index: number) => Promise<unknown>,
): Promise<void> {
	for (let i = 0; i < items.length; i += size) {
		const slice = items.slice(i, i + size);
		await Promise.all(slice.map((it, j) => fn(it, i + j)));
	}
}

// ------------------------------------------------------------------- wipe ----
async function wipe() {
	console.log("🧹 Nettoyage des données existantes (hors SUPER_ADMIN)...");
	// Ordre : enfants → parents. Les cascades couvrent l'essentiel via Etablissement.
	await prisma.etablissement.deleteMany({});
	await prisma.user.deleteMany({
		where: { role: { not: RoleUser.SUPER_ADMIN } },
	});
}

async function main() {
	console.log(
		`🌱 Seed massif : ${cfg.schools} écoles × ${cfg.studentsPer} élèves...`,
	);
	const passwordHash = await bcrypt.hash(cfg.password, 12);

	// Super admin (idempotent).
	const superEmail = "ahmedchoulak80@superadmin.taysir.dz";
	await prisma.user.upsert({
		where: { email: superEmail },
		update: { password: passwordHash },
		create: {
			email: superEmail,
			password: passwordHash,
			firstName: "Ahmed",
			lastName: "Choulak",
			role: RoleUser.SUPER_ADMIN,
			status: "ACTIVE",
		},
	});

	await wipe();

	const t0 = Date.now();
	for (let i = 0; i < cfg.schools; i++) {
		const { slug } = await seedSchool(i, passwordHash);
		console.log(`  ✅ [${i + 1}/${cfg.schools}] ${slug}`);
	}
	const secs = ((Date.now() - t0) / 1000).toFixed(1);

	// Récapitulatif.
	const [etabs, usersC, studentsC, plansC, sessionsC, attendanceC] =
		await Promise.all([
			prisma.etablissement.count(),
			prisma.user.count(),
			prisma.student.count(),
			prisma.paymentPlan.count(),
			prisma.session.count(),
			prisma.attendanceRecord.count(),
		]);
	console.log("\n✨ Seed massif terminé en", secs, "s");
	console.table({
		établissements: etabs,
		utilisateurs: usersC,
		élèves: studentsC,
		échéanciers: plansC,
		séances: sessionsC,
		présences: attendanceC,
	});
	console.log(
		`\n🔐 Mot de passe commun : ${cfg.password}  (ex: gerant.ecole1@taysir.dz)`,
	);
}

main()
	.catch((e) => {
		console.error("❌ Erreur seed massif :", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
