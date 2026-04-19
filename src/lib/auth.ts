import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

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

					if (!user || user.status !== "ACTIVE") {
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
	},
	pages: {
		signIn: "/fr/login",
	},
	session: {
		strategy: "jwt",
	},
	secret: process.env.NEXTAUTH_SECRET ?? "",
};
