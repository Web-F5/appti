// src/app/(dashboard)/settings/page.tsx
import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'
import SettingsTabs from '@/components/dashboard/SettingsTabs'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const session = await requireSession()

  const business = await prisma.business.findUnique({
    where: { slug: session.user.businessSlug },
    include: {
      reminderTemplates: { orderBy: { channel: 'asc' } },
      staffMembers: {
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      },
      services: {
        orderBy: { name: 'asc' },
        include: {
          staffServices: { select: { staffMemberId: true } },
        },
      },
    },
  })

  if (!business) return <div className="text-gray-500">Business not found.</div>

  const serialised = {
    ...business,
    creditBalance: Number(business.creditBalance),
    services: business.services.map(s => ({
      ...s,
      price: s.price ? Number(s.price) : null,
      staffIds: s.staffServices.map(ss => ss.staffMemberId),
    })),
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8" style={{ color: 'var(--text-dark)' }}>Settings</h1>
      <SettingsTabs business={serialised} />
    </div>
  )
}
