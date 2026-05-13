// src/app/(dashboard)/reports/page.tsx
import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { getBusinessBySlug } from '@/lib/dashboard/queries'
import { prisma } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Reports' }


export default async function ReportsPage() {
  const session = await requireSession()
  const business = await getBusinessBySlug(session.user.businessSlug)
  if (!business) return <div className="text-gray-500">Business not found.</div>

  const [byService, byStatus, byMonth] = await Promise.all([
    // Appointments by service
    prisma.appointment.groupBy({
      by: ['serviceId'],
      where: { service: { businessId: business.id } },
      _count: { serviceId: true },
    }),

    // Appointments by status
    prisma.appointment.groupBy({
      by: ['status'],
      where: { service: { businessId: business.id } },
      _count: { status: true },
      orderBy: { _count: { status: 'desc' } },
    }),

    // Last 6 months appointment counts
    prisma.$queryRaw<{ month: string; count: bigint }[]>`
      SELECT to_char(a.starts_at, 'Mon YYYY') as month,
             COUNT(*) as count
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      WHERE s.business_id = ${business.id}
        AND a.starts_at >= NOW() - INTERVAL '6 months'
      GROUP BY to_char(a.starts_at, 'Mon YYYY'), date_trunc('month', a.starts_at)
      ORDER BY date_trunc('month', a.starts_at) ASC
    `,
  ])

  const services = await prisma.service.findMany({
    where: { businessId: business.id },
    select: { id: true, name: true, color: true },
  })
  const serviceMap = Object.fromEntries(services.map(s => [s.id, s]))

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    PENDING:   'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-600',
    NO_SHOW:   'bg-orange-100 text-orange-700',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* By status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Appointments by status</h2>
          <div className="space-y-2">
            {byStatus.map(row => (
              <div key={row.status} className="flex items-center justify-between">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[row.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {row.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">{row._count.status}</span>
              </div>
            ))}
            {byStatus.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>

        {/* By service */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Appointments by service</h2>
          <div className="space-y-2">
            {byService.map(row => {
              const service = serviceMap[row.serviceId]
              return service ? (
                <div key={row.serviceId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: service.color ?? '#6366f1' }} />
                    <span className="text-sm text-gray-700">{service.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{row._count.serviceId}</span>
                </div>
              ) : null
            })}
            {byService.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Monthly appointments (last 6 months)</h2>
        {byMonth.length === 0 ? (
          <p className="text-sm text-gray-400">No data yet</p>
        ) : (
          <div className="flex items-end gap-3 h-32">
            {byMonth.map(row => {
              const max = Math.max(...byMonth.map(r => Number(r.count)))
              const pct = max > 0 ? (Number(row.count) / max) * 100 : 0
              return (
                <div key={row.month} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs font-semibold text-gray-700">{Number(row.count)}</span>
                  <div className="w-full bg-blue-100 rounded-t-md" style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px' }}>
                    <div className="w-full h-full bg-blue-500 rounded-t-md" />
                  </div>
                  <span className="text-xs text-gray-400 text-center leading-tight">{row.month}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
