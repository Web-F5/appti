// src/app/(dashboard)/staff/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { getBusinessBySlug } from '@/lib/dashboard/queries'
import { prisma } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Staff' }


const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
}

export default async function StaffPage() {
  const session = await requireSession()
  const business = await getBusinessBySlug(session.user.businessSlug)
  if (!business) return <div className="text-gray-500">Business not found.</div>

  const staff = await prisma.staffMember.findMany({
    where: { businessId: business.id },
    include: {
      availabilityRules: { orderBy: { dayOfWeek: 'asc' } },
      staffServices: { include: { service: { select: { name: true, color: true } } } },
      _count: { select: { appointments: true } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Staff</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/settings?tab=staff" className="btn-primary" style={{ color: 'white', textDecoration: 'none' }}>
          + Add staff
        </Link>
      </div>

      <div className="space-y-4">
        {staff.map((member) => (
          <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                {member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{member.email}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {member.availabilityRules.map(rule => (
                    <span key={rule.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {DAY_LABELS[rule.dayOfWeek]} {rule.startTime}–{rule.endTime}
                    </span>
                  ))}
                </div>
                {member.staffServices.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {member.staffServices.map(ss => (
                      <span key={ss.service.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.service.color ?? '#6366f1' }} />
                        {ss.service.name}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">{member._count.appointments} total appointments</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
