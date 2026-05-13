// src/app/(dashboard)/services/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { getBusinessBySlug } from '@/lib/dashboard/queries'
import { prisma } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Services' }

export default async function ServicesPage() {
  const session  = await requireSession()
  const business = await getBusinessBySlug(session.user.businessSlug)
  if (!business) return <div style={{ color: 'var(--text-muted)' }}>Business not found.</div>

  const services = await prisma.service.findMany({
    where:   { businessId: business.id },
    include: {
      _count:       { select: { appointments: true } },
      staffServices: { include: { staffMember: { select: { name: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Services</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {services.length} service{services.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/settings" className="btn-primary" style={{ color: 'white', textDecoration: 'none' }}>
          + Add service
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service) => (
          <div key={service.id} className="card p-5">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                style={{ background: service.color ?? 'var(--purple-mid)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>
                    {service.name}
                  </h3>
                  <span className="badge" style={{
                    background: service.isActive ? '#D1FAE5' : 'var(--surface)',
                    color:      service.isActive ? '#065F46' : 'var(--text-muted)',
                  }}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {service.description && (
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {service.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {service.durationMins} min
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-dark)' }}>
                    {service.price ? `$${Number(service.price).toFixed(2)}` : 'Quote'}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {service._count.appointments} bookings
                  </span>
                </div>
                {service.staffServices.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {service.staffServices.map(ss => (
                      <span key={ss.staffMember.name} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--purple-light)', color: 'var(--purple-dark)' }}>
                        {ss.staffMember.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
