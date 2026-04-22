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
	}

	// 3. I18n
	return intlMiddleware(req);
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
};
