import { RoleUser, StatutPresence, StatusSession, StatusPaymentPlan } from "@prisma/client";

export { RoleUser as UserRole };

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  etablissementId?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleUser;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface Room {
  id: string;
  etablissementId: string;
  name: string;
  capacity: number;
  description?: string | null;
}

export interface Activity {
  id: string;
  etablissementId: string;
  name: string;
  description?: string | null;
  duration?: number | null;
  color?: string | null;
}

export interface Group {
  id: string;
  etablissementId: string;
  name: string;
  activityId: string;
  instructorId: string;
  isActive: boolean;
  students?: { id: string }[];
}

export interface Student {
  id: string;
  etablissementId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
  registrationDate: Date;
  isActive: boolean;
  groups?: { id: string }[];
}

export interface Session {
  id: string;
  etablissementId: string;
  activityId: string;
  roomId: string;
  instructorId: string;
  groupId?: string | null;
  startTime: Date;
  endTime: Date;
  status: StatusSession;
}

export interface Payment {
  id: string;
  etablissementId: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: StatusPaymentPlan;
}

export interface AttendanceRecord {
  id: string;
  etablissementId: string;
  sessionId: string;
  studentId: string;
  status: StatutPresence;
  note?: string | null;
}
