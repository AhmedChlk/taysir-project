import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.warn("[AUTH]: Tentative de connexion sans identifiants.");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { etablissement: true }
          });

          if (!user) {
            console.warn(`[AUTH]: Utilisateur non trouvé pour l'email: ${credentials.email}`);
            return null;
          }

          if (!user.isActive) {
            console.warn(`[AUTH]: Compte désactivé pour: ${credentials.email}`);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            console.warn(`[AUTH]: Mot de passe invalide pour: ${credentials.email}`);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            etablissementId: user.etablissementId || undefined,
          };
        } catch (error) {
          console.error("[AUTH_CRITICAL_ERROR]:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.etablissementId = user.etablissementId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).etablissementId = token.etablissementId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
