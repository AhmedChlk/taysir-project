"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

/* Reçoit la session résolue côté serveur (getServerSession) pour hydrater
   next-auth immédiatement. Sans elle, useSession() démarrerait en "loading" à
   chaque navigation et la coquille du dashboard clignoterait en spinner. */
export default function SessionProviderWrapper({
	children,
	session,
}: {
	children: React.ReactNode;
	session: Session | null;
}) {
	return <SessionProvider session={session}>{children}</SessionProvider>;
}
