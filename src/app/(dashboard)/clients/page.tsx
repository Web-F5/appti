// src/app/(dashboard)/clients/page.tsx
import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { getBusinessBySlug, getRecentClients } from '@/lib/dashboard/queries'
import { prisma } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Clients' }



export default async function ClientsPage() {
  const session = await requireSession()
  const business = await getBusinessBySlug(session.user.businessSlug)
  if (!business) return <div className="text-gray-500">Business not found.</div>

  const clients = await prisma.client.findMany({
    where: { businessId: business.id },
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p className="text-sm font-medium text-gray-400">No clients yet</p>
            <p className="text-xs text-gray-300 mt-1">Clients appear here after their first booking</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Phone</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Bookings</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">First seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold shrink-0">
                        {client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{client.email}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{client.phone ?? '—'}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {client._count.appointments}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400">
                    {client.createdAt.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
