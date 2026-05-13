// src/lib/utils/index.ts
// General-purpose utilities used across the app.

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatInTimeZone } from 'date-fns-tz'
import type { ReminderTemplateVars } from '@/types'

// ── Tailwind class helper ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Date / time ───────────────────────────────────────────────────────────────

/** Format a date in a given timezone for display */
export function formatInTz(date: Date, timezone: string, fmt = 'EEEE d MMM yyyy, h:mm a'): string {
  return formatInTimeZone(date, timezone, fmt)
}

/** Format a time-only string (HH:MM) for display */
export function formatTime(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'h:mm a')
}

// ── Reminder template rendering ───────────────────────────────────────────────

/**
 * Replace {{variable}} placeholders in a reminder template string.
 * Unknown variables are left as-is.
 */
export function renderTemplate(template: string, vars: Partial<ReminderTemplateVars>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return (vars as Record<string, string>)[key] ?? match
  })
}

// ── API responses ─────────────────────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200): Response {
  return Response.json({ data, error: null }, { status })
}

export function apiError(message: string, status = 400, code?: string): Response {
  return Response.json({ data: null, error: message, code }, { status })
}

// ── Misc ──────────────────────────────────────────────────────────────────────

/** Normalise a phone number to E.164 format (basic — AU-focused) */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) {
    return `+61${digits.slice(1)}`
  }
  if (digits.startsWith('61') && digits.length === 11) {
    return `+${digits}`
  }
  return `+${digits}`
}

/** Generate a cancel/reschedule token (simple — swap for JWT in production) */
export function generateAppointmentToken(appointmentId: string): string {
  const payload = Buffer.from(JSON.stringify({ id: appointmentId, ts: Date.now() })).toString(
    'base64url'
  )
  return payload
}
