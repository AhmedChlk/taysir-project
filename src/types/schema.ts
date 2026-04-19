import {
	PaymentMethod,
	RoleUser,
	StatusDocument,
	type StatusPaymentPlan,
	type StatusSession,
	type StatutPresence,
	UserStatus,
} from "@prisma/client";

export { PaymentMethod, RoleUser as UserRole, StatusDocument, UserStatus };

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
	status: UserStatus;
	salary?: number | null;
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
	sessions?: Session[];
	paymentPlans?: PaymentPlan[];
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
	address?: string | null;
	isMinor?: boolean;
	photoUrl?: string | null;
	parentName?: string | null;
	parentPhone?: string | null;
	parentEmail?: string | null;
	birthDate?: Date | null;
	registrationDate: Date;
	isActive: boolean;
	createdAt?: Date;
	updatedAt?: Date;
	groups?: Group[];
	documents?: Document[];
	paymentPlans?: PaymentPlan[];
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
	activity?: Activity;
	room?: Room;
	group?: Group;
}

export interface PaymentPlan {
	id: string;
	etablissementId: string;
	studentId: string;
	activityId: string;
	totalAmount: number;
	paidAmount: number;
	currency: string;
	status: StatusPaymentPlan;
	tranches?: Tranche[];
	student?: Student;
	activity?: Activity;
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
	paymentPlan?: PaymentPlan;
}

export interface Paiement {
	id: string;
	amount: number;
	date: Date;
	method: PaymentMethod;
	reference?: string | null;
	receiptUrl?: string | null;
	note?: string | null;
	trancheId: string;
	tranche?: Tranche;
}

export interface AttendanceRecord {
	id: string;
	etablissementId: string;
	sessionId: string;
	studentId: string;
	status: StatutPresence;
	note?: string | null;
}

export interface Document {
	id: string;
	etablissementId: string;
	studentId: string;
	name: string;
	url: string;
	type?: string | null;
	status: StatusDocument;
	createdAt: Date;
	updatedAt: Date;
}

export interface Message {
	id: string;
	etablissementId: string;
	content: string;
	senderId: string;
	recipientId?: string | null;
	createdAt: Date;
}
