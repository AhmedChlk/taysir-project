import { RoleUser, StatutPresence, StatusSession, StatusPaymentPlan, PaymentMethod } from "@prisma/client";

export { RoleUser as UserRole, PaymentMethod };

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
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  students?: Student[];
}

export interface Student {
  id: string;
  etablissementId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isMinor?: boolean;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  birthDate?: Date | null;
  registrationDate: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  groups?: Group[];
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

export interface PaymentPlan {
  id: string;
  etablissementId: string;
  studentId: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: StatusPaymentPlan;
  tranches?: Tranche[];
  student?: Student;
}

// Alias to avoid breaking existing code that uses 'Payment'
export type Payment = PaymentPlan;

export interface Tranche {
  id: string;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
  paymentPlanId: string;
  paiements?: Paiement[];
}

export interface Paiement {
  id: string;
  amount: number;
  date: Date;
  method: PaymentMethod;
  reference?: string | null;
  note?: string | null;
  trancheId: string;
}

export interface AttendanceRecord {
  id: string;
  etablissementId: string;
  sessionId: string;
  studentId: string;
  status: StatutPresence;
  note?: string | null;
}
