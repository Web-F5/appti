// src/types/index.ts
// Shared types used across the application.
// Prisma generates its own types — these are app-layer types built on top.

import type {
  Business,
  Service,
  StaffMember,
  Appointment,
  Client,
  Reminder,
  AvailabilityRule,
  Plan,
  AppointmentStatus,
  ReminderChannel,
  ReminderStatus,
} from '@prisma/client'

// ── Re-exports for convenience ────────────────────────────────────────────────
export type {
  Business,
  Service,
  StaffMember,
  Appointment,
  Client,
  Reminder,
  AvailabilityRule,
  Plan,
  AppointmentStatus,
  ReminderChannel,
  ReminderStatus,
}

// ── Enriched / joined types ───────────────────────────────────────────────────

export type AppointmentWithRelations = Appointment & {
  service: Service
  staffMember: StaffMember
  client: Client
  reminders: Reminder[]
}

export type StaffMemberWithAvailability = StaffMember & {
  availabilityRules: AvailabilityRule[]
  staffServices: { serviceId: string }[]
}

export type ServiceWithStaff = Service & {
  staffServices: { staffMember: StaffMember }[]
}

// ── Booking flow types ────────────────────────────────────────────────────────

/** A computed available slot returned by the availability engine */
export type TimeSlot = {
  startsAt: Date
  endsAt: Date
  staffMemberId: string
  staffMemberName: string
}

/** Payload submitted from the booking widget to create an appointment */
export type BookingPayload = {
  businessSlug: string
  serviceId: string
  staffMemberId: string
  startsAt: string   // ISO string
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientNotes?: string
}

// ── API response types ────────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  data: T
  error: null
}

export type ApiError = {
  data: null
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Pricing / billing types ───────────────────────────────────────────────────

export type PlanConfig = {
  plan: Plan
  monthlyFee: number
  includedSms: number
  includedEmail: number
  smsRate: number
  emailRate: number
}

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  PAYG: {
    plan: 'PAYG',
    monthlyFee: 0,
    includedSms: 0,
    includedEmail: 0,
    smsRate: Number(process.env.RATE_SMS_PAYG ?? 0.12),
    emailRate: Number(process.env.RATE_EMAIL_PAYG ?? 0.005),
  },
  STARTER: {
    plan: 'STARTER',
    monthlyFee: 29,
    includedSms: Number(process.env.BUNDLE_SMS_STARTER ?? 150),
    includedEmail: Number(process.env.BUNDLE_EMAIL_STARTER ?? 500),
    smsRate: Number(process.env.RATE_SMS_STARTER ?? 0.08),
    emailRate: Number(process.env.RATE_EMAIL_STARTER ?? 0.003),
  },
  PRO: {
    plan: 'PRO',
    monthlyFee: 79,
    includedSms: Number(process.env.BUNDLE_SMS_PRO ?? 500),
    includedEmail: Number(process.env.BUNDLE_EMAIL_PRO ?? 2000),
    smsRate: Number(process.env.RATE_SMS_PRO ?? 0.06),
    emailRate: Number(process.env.RATE_EMAIL_PRO ?? 0.002),
  },
}

// ── Reminder template variables ───────────────────────────────────────────────

/** Variables available in reminder body/subject templates */
export type ReminderTemplateVars = {
  client_name: string
  business_name: string
  service_name: string
  staff_name: string
  time: string           // e.g. "Tuesday 14 Jan at 10:00 AM"
  date: string
  duration: string       // e.g. "60 minutes"
  location: string
  cancel_url: string
  reschedule_url: string
}
