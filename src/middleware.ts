import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;

	// Routes protégées — vérification JWT avant rendu
	if (pathname.includes("/dashboard")) {
		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({
			req,
			secret: secret ?? "",
		});

		if (!token) {
			// Extraire la locale depuis le pathname (ex: /fr/dashboard → fr)
			const localeMatch = pathname.match(/^\/(fr|ar)\//);
			const locale = localeMatch?.[1] ?? "fr";
			const loginUrl = new URL(`/${locale}/login`, req.url);
			loginUrl.searchParams.set("callbackUrl", pathname);
			return NextResponse.redirect(loginUrl);
		}
	}

	// I18n middleware pour toutes les routes
	return intlMiddleware(req);
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
};
