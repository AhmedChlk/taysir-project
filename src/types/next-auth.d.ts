import { DefaultSession } from "next-auth";
import { RoleUser } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      etablissementId?: string;
      role: RoleUser;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    etablissementId?: string;
    role: RoleUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    etablissementId?: string;
    role: RoleUser;
  }
}
