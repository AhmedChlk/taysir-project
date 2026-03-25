// Sécurisation des actions serveur

import { z } from "zod";
import { ErrorCodes, TaysirError } from "@/lib/errors";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { RoleUser } from "@prisma/client";

// Récupération de la session
async function getAuthSession() {
  return await getServerSession(authOptions);
}

// Format de réponse des actions
export type ActionResponse<TOutput> = 
  | { success: true; data: TOutput }
  | { success: false; error: { code: string; message: string; details?: unknown } };

// Wrapper pour sécuriser les actions
export function createSafeAction<TInput, TOutput>(
  schema: z.ZodType<TInput>,
  handler: (data: TInput, ctx: { tenantId: string; userId: string; role: string }) => Promise<TOutput>
) {
  return async (input: TInput): Promise<ActionResponse<TOutput>> => {
    try {
      // 1. Vérification de l'auth
      const session = await getAuthSession();
      if (!session || !session.user) {
        throw new TaysirError("Accès refusé : Session non valide.", ErrorCodes.ERR_UNAUTHORIZED, 401);
      }

      // 2. Vérification de l'établissement (tenant)
      const tenantId = session.user.etablissementId;
      if (!tenantId && session.user.role !== RoleUser.SUPER_ADMIN) {
        throw new TaysirError(
          "Erreur d'isolation : Aucun établissement rattaché à ce compte.",
          ErrorCodes.ERR_TENANT_MISMATCH,
          403
        );
      }

      // 3. Validation des données avec Zod
      const validation = schema.safeParse(input);
      if (!validation.success) {
        throw new TaysirError(
          "Données invalides : Échec de la validation structurée.",
          ErrorCodes.ERR_INVALID_DATA,
          400,
          validation.error.flatten()
        );
      }

      // 4. Exécution de la logique
      const result = await handler(validation.data, {
        tenantId: tenantId || "SUPERADMIN_ACCESS",
        userId: session.user.id,
        role: session.user.role,
      });

      return { success: true, data: result };

    } catch (error) {
      // 5. Gestion des erreurs
      if (error instanceof TaysirError) {
        return {
          success: false,
          error: { code: error.code, message: error.message, details: error.details },
        };
      }

      // Erreur inconnue
      console.error(`[SERVER_ACTION_ERROR]: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      return {
        success: false,
        error: {
          code: ErrorCodes.ERR_INTERNAL_SERVER,
          message: "Une erreur système inattendue est survenue.",
        },
      };
    }
  };
}
