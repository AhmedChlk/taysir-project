import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// 1. Skip assets, api routes and internal next calls
	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		pathname.includes(".")
	) {
		return NextResponse.next();
	}

	// 2. Auth protection
	if (pathname.includes("/dashboard") || pathname.includes("/superadmin")) {
		const token = await getToken({
			req,
			secret: process.env.NEXTAUTH_SECRET!,
		});

		if (!token) {
			const locale = pathname.split("/")[1] || "fr";
			const loginUrl = new URL(`/${locale}/login`, req.url);
			loginUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(loginUrl);
		}

		// Role-based redirection
		const locale = pathname.split("/")[1] || "fr";
		const isSuperAdmin = token.role === "SUPER_ADMIN";
		const isDashboardPath = pathname.includes("/dashboard");
		const isSuperAdminPath = pathname.includes("/superadmin");

		if (isSuperAdmin && isDashboardPath) {
			return NextResponse.redirect(new URL(`/${locale}/superadmin`, req.url));
		}

		if (!isSuperAdmin && isSuperAdminPath) {
			return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
		}

		// Seuls les rôles opérationnels ont accès au tableau de bord. PARTICIPANT
		// (élève) et RESPONSABLE (parent) n'ont pas encore de portail dédié : on
		// les sort du dashboard vers la page publique (sinon ils voyaient le
		// cockpit dirigeant complet). Tout rôle inconnu est refusé par défaut.
		const DASHBOARD_ROLES = ["ADMIN", "GERANT", "SECRETAIRE", "INTERVENANT"];
		if (isDashboardPath && !DASHBOARD_ROLES.includes(token.role as string)) {
			return NextResponse.redirect(new URL(`/${locale}`, req.url));
		}

		// Garde par rôle (defense-in-depth, en plus de la barre filtrée) : chaque
		// rôle a un périmètre. L'enseignant garde son espace + planning + présences ;
		// la secrétaire fait du front-desk mais pas le pilotage pur (personnel,
		// activités). Toute page hors périmètre redirige vers l'accueil du rôle.
		const BLOCKED_BY_ROLE: Record<string, string[]> = {
			INTERVENANT: [
				"students",
				"payments",
				"groups",
				"rooms",
				"activities",
				"staff",
			],
			SECRETAIRE: ["activities", "staff"],
		};
		const blocked = BLOCKED_BY_ROLE[token.role as string];
		// Matching par SEGMENT (pas substring) : le segment qui suit "dashboard"
		// dans le chemin. Évite qu'une future route type "students-archive" soit
		// bloquée par erreur, et empêche tout contournement par sous-chaîne.
		if (blocked && isDashboardPath) {
			const segments = pathname.split("/");
			const dashIdx = segments.indexOf("dashboard");
			const section = dashIdx >= 0 ? segments[dashIdx + 1] : undefined;
			if (section && blocked.includes(section)) {
				return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
			}
		}
	}

	// 3. I18n
	return intlMiddleware(req);
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
};
