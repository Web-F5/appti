// src/app/api/availability/route.ts
// GET /api/availability?businessSlug=...&serviceId=...&date=YYYY-MM-DD[&staffMemberId=...]
//
// Returns available time slots for a given service and date.
// Called by the client-facing booking widget date/time picker.

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { getAvailableSlots } from '@/lib/availability/slots'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const businessSlug  = searchParams.get('businessSlug')
  const serviceId     = searchParams.get('serviceId')
  const date          = searchParams.get('date')          // YYYY-MM-DD
  const staffMemberId = searchParams.get('staffMemberId') // optional

  // ── Validate required params ──────────────────────────────────────────────
  if (!businessSlug || !serviceId || !date) {
    return apiError('Missing required params: businessSlug, serviceId, date', 400)
  }

  // Basic date format validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError('Invalid date format — use YYYY-MM-DD', 400)
  }

  // Reject past dates
  const today = new Date().toISOString().split('T')[0]
  if (date < today) {
    return apiError('Cannot request slots for past dates', 400)
  }

  // ── Run slot calculation ──────────────────────────────────────────────────
  try {
    const slots = await getAvailableSlots({
      businessSlug,
      serviceId,
      date,
      staffMemberId: staffMemberId ?? undefined,
    })

    // Serialize dates to ISO strings for the JSON response
    const serialized = slots.map((slot) => ({
      startsAt:        slot.startsAt.toISOString(),
      endsAt:          slot.endsAt.toISOString(),
      staffMemberId:   slot.staffMemberId,
      staffMemberName: slot.staffMemberName,
    }))

    return apiSuccess({
      date,
      businessSlug,
      serviceId,
      count: serialized.length,
      slots: serialized,
    })
  } catch (err) {
    console.error('[availability] Slot calculation error:', err)
    return apiError('Failed to calculate available slots', 500)
  }
}
