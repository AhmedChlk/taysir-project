import { z } from "zod";
import { RoleUser, PaymentMethod, StatutPresence, UserStatus } from "@prisma/client";

export const UserRoleSchema = z.nativeEnum(RoleUser);
export const UserStatusSchema = z.nativeEnum(UserStatus);

export const CreateUserSchema = z.object({
  email: z.string().email("Format d'email invalide."),
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères."),
  role: z.nativeEnum(RoleUser),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
  avatarUrl: z.string().url().optional(),
});

export const UpdateUserSchema = z.object({
  id: z.string().uuid("ID utilisateur invalide."),
  email: z.string().email("Format d'email invalide.").optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.nativeEnum(RoleUser).optional(),
  status: UserStatusSchema.optional(),
  salary: z.number().nonnegative("Le salaire doit être positif.").optional().nullable(),
  avatarUrl: z.string().url().optional(),
});

export const ListUsersSchema = z.object({
  role: z.nativeEnum(RoleUser).optional(),
});

export const CreatePaymentPlanSchema = z.object({
  studentId: z.string().uuid(),
  activityId: z.string().uuid("L'activité est requise."),
  totalAmount: z.number().positive(),
  currency: z.string().length(3).default("DZD"),
  tranches: z.array(z.object({
    amount: z.number().positive(),
    dueDate: z.string(), // ISO Date
  })).min(1),
});

export const RegisterPaymentSchema = z.object({
  trancheId: z.string().uuid("ID de tranche invalide."),
  montant_paye: z.number().positive("Le montant doit être supérieur à zéro."),
  methode: z.nativeEnum(PaymentMethod),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export const MarkPresenceSchema = z.object({
  seanceId: z.string().uuid("ID de séance invalide."),
  participantId: z.string().uuid("ID de participant invalide."),
  statut: z.nativeEnum(StatutPresence),
  retard: z.number().int().min(0, "Le retard doit être positif.").optional(),
  note: z.string().optional(),
});

export const RoomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2, "Nom trop court."),
  capacity: z.number().int().min(1, "Capacité minimum 1."),
  description: z.string().optional().nullable(),
});

export const ActivitySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  duration: z.number().int().min(15).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().nullable(),
});

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
  status: UserStatusSchema,
  salary: z.number().nonnegative().optional().nullable(),
});

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
  address: z.string().optional().nullable(),
  photoUrl: z.string().url("Une photo est obligatoire pour l'inscription."),
  isMinor: z.boolean().default(false),
  parentName: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
  parentEmail: z.string().optional().nullable(),
  groupIds: z.array(z.string().uuid()).optional().default([]),
});

export const UpdateStudentSchema = CreateStudentSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
  photoUrl: z.string().url().optional().nullable(),
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
  activityId: z.string().uuid(),
  roomId: z.string().uuid(),
  instructorId: z.string().uuid(),
  groupId: z.string().uuid(),
  startTime: z.date(),
  endTime: z.date(),
  status: z.enum(['SCHEDULED', 'CANCELLED', 'COMPLETED']),
});

export const CreateSessionSchema = z.object({
  activityId: z.string().uuid("Activité invalide."),
  roomId: z.string().uuid("Salle invalide."),
  instructorId: z.string().uuid("Intervenant invalide."),
  groupId: z.string().uuid("Groupe invalide."),
  startTime: z.date(),
  endTime: z.date(),
}).refine(data => data.endTime > data.startTime, {
  message: "L'heure de fin doit être après l'heure de début.",
  path: ["endTime"]
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

export const SendMessageSchema = z.object({
  recipientId: z.string().uuid("ID destinataire invalide.").optional().nullable(),
  content: z.string().min(1, "Le message ne peut pas être vide."),
});

export const CreateDocumentSchema = z.object({
  studentId: z.string().uuid(),
  name: z.string().min(2, "Le nom du document est requis."),
  url: z.string().url("URL du document invalide."),
  type: z.string().optional().nullable(),
});

export const UpdateDocumentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});
