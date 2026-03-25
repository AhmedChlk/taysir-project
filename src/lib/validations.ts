// Schémas de validation avec Zod

import { z } from "zod";
import { RoleUser, PaymentMethod, StatutPresence } from "@prisma/client";

// Les rôles autorisés
export const UserRoleSchema = z.nativeEnum(RoleUser);

// Validation pour la création d'utilisateur
export const CreateUserSchema = z.object({
  email: z.string().email("Format d'email invalide."),
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères."),
  role: z.nativeEnum(RoleUser),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
  avatarUrl: z.string().url().optional(),
});

// Validation pour la modification d'utilisateur
export const UpdateUserSchema = z.object({
  id: z.string().uuid("ID utilisateur invalide."),
  email: z.string().email("Format d'email invalide.").optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.nativeEnum(RoleUser).optional(),
  isActive: z.boolean().optional(),
  avatarUrl: z.string().url().optional(),
});

// Filtres pour la liste des utilisateurs
export const ListUsersSchema = z.object({
  role: z.nativeEnum(RoleUser).optional(),
});

// Validation des plans de paiement
export const CreatePaymentPlanSchema = z.object({
  studentId: z.string().uuid(),
  totalAmount: z.number().positive(),
  currency: z.string().length(3).default("DZD"),
  tranches: z.array(z.object({
    amount: z.number().positive(),
    dueDate: z.string(), // ISO Date
  })).min(1),
});

// Validation des paiements
export const RegisterPaymentSchema = z.object({
  trancheId: z.string().uuid("ID de tranche invalide."),
  montant_paye: z.number().positive("Le montant doit être supérieur à zéro."),
  methode: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  note: z.string().optional(),
});

// Validation de la présence
export const MarkPresenceSchema = z.object({
  seanceId: z.string().uuid("ID de séance invalide."),
  participantId: z.string().uuid("ID de participant invalide."),
  statut: z.nativeEnum(StatutPresence),
  retard: z.number().int().min(0, "Le retard doit être positif.").optional(),
  note: z.string().optional(),
});

// Validation des salles
export const RoomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nom trop court."),
  capacity: z.number().int().min(1, "Capacité minimum 1."),
  description: z.string().optional().nullable(),
});

// Validation des activités
export const ActivitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(15).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable(),
});

// Schémas de base pour la base de données
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  slug: z.string().min(2),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UserSchema = z.object({
  id: z.string(),
  etablissementId: z.string().optional().nullable(),
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: UserRoleSchema,
  avatarUrl: z.string().url().optional().nullable(),
  isActive: z.boolean(),
});

// Validation pour les groupes
export const CreateGroupSchema = z.object({
  name: z.string().min(2, "Nom trop court."),
});

export const UpdateGroupSchema = CreateGroupSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const GroupSchema = z.object({
  id: z.string(),
  etablissementId: z.string(),
  name: z.string().min(2),
  isActive: z.boolean(),
});

export const CreateStudentSchema = z.object({
  firstName: z.string().min(2, "Prénom trop court."),
  lastName: z.string().min(2, "Nom trop court."),
  email: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")),
  isMinor: z.boolean().default(false),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
  parentEmail: z.string().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
});

export const UpdateStudentSchema = CreateStudentSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const StudentSchema = z.object({
  id: z.string(),
  etablissementId: z.string(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  birthDate: z.date().optional().nullable(),
  registrationDate: z.date(),
  isActive: z.boolean(),
});

export const SessionSchema = z.object({
  id: z.string(),
  etablissementId: z.string(),
  activityId: z.string(),
  roomId: z.string(),
  instructorId: z.string(),
  groupId: z.string().optional().nullable(),
  startTime: z.date(),
  endTime: z.date(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']),
});

export const PaymentSchema = z.object({
  id: z.string(),
  etablissementId: z.string(),
  studentId: z.string(),
  totalAmount: z.number().positive(),
  paidAmount: z.number().nonnegative(),
  currency: z.string().length(3),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID']),
});

export const AttendanceRecordSchema = z.object({
  id: z.string(),
  etablissementId: z.string(),
  sessionId: z.string(),
  studentId: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'RETARD', 'JUSTIFIE']),
  note: z.string().optional().nullable(),
});
