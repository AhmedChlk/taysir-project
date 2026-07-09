import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

// Refus catégorique d'un secret vide : un secret "" signerait des JWT
// trivialement forgeables (un attaquant se fabriquerait un token SUPER_ADMIN).
// En production on échoue au démarrage ; en dev/test on tolère l'absence
// (next-auth applique son propre défaut de dev).
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;
if (process.env.NODE_ENV === "production" && !NEXTAUTH_SECRET) {
	throw new Error(
		"NEXTAUTH_SECRET est requis en production (secret vide = JWT forgeables).",
	);
}

// Hash bidon (coût 12) pour égaliser le temps de réponse quand le compte
// n'existe pas : sans lui, l'absence de bcrypt.compare crée un canal temporel
// permettant d'énumérer les emails valides.
const DUMMY_HASH = "$2b$12$kJUQJtnAR1RnAWUPATr6Ce1WRldTDsWWLvXqtyiJ8BVyrZJA2sZZm";

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				try {
					if (!credentials?.email || !credentials?.password) {
						return null;
					}

					const user = await prisma.user.findUnique({
						where: { email: credentials.email },
						include: { etablissement: true },
					});

					// Compte inexistant / inactif : on effectue quand même un compare
					// bcrypt bidon pour ne pas révéler par le temps de réponse si
					// l'email existe, puis on refuse.
					if (!user || user.status !== "ACTIVE") {
						await bcrypt.compare(credentials.password, DUMMY_HASH);
						return null;
					}

					// Bloquer si le tenant est désactivé (sauf si Super Admin)
					if (
						user.role !== "SUPER_ADMIN" &&
						user.etablissement &&
						!user.etablissement.isActive
					) {
						await bcrypt.compare(credentials.password, DUMMY_HASH);
						return null;
					}

					const isPasswordValid = await bcrypt.compare(
						credentials.password,
						user.password,
					);

					if (!isPasswordValid) {
						return null;
					}

					return {
						id: user.id,
						email: user.email,
						name: `${user.firstName} ${user.lastName}`,
						role: user.role,
						etablissementId: user.etablissementId ?? "",
					};
				} catch (error) {
					console.error("[AUTH_ERROR]:", error);
					return null;
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = user.role;
				token.etablissementId = user.etablissementId ?? "";
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id;
				session.user.role = token.role;
				if (token.etablissementId !== undefined) {
					session.user.etablissementId = token.etablissementId;
				}
			}
			return session;
		},
		async redirect({ url, baseUrl }) {
			// Allows relative callback URLs
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// Allows callback URLs on the same origin
			else if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		},
	},
	pages: {
		signIn: "/login",
	},
	session: {
		strategy: "jwt",
		// Re-signe le JWT au plus tard toutes les 24h : borne la fenêtre pendant
		// laquelle un rôle/statut modifié côté DB reste "collé" dans un vieux token.
		maxAge: 24 * 60 * 60,
	},
	// Fourni seulement s'il existe (en prod il est garanti par le throw ci-dessus ;
	// en dev/test absent, next-auth applique son défaut). `exactOptionalPropertyTypes`
	// interdit `secret: undefined`, d'où le spread conditionnel.
	...(NEXTAUTH_SECRET ? { secret: NEXTAUTH_SECRET } : {}),
};
