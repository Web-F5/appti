import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma/client'
import BookingWizard from '@/components/booking/BookingWizard'

type Props = { params: Promise<{ businessSlug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params
  const business = await prisma.business.findUnique({ where: { slug: businessSlug }, select: { name: true } })
  return { title: business ? `Book with ${business.name}` : 'Book an appointment' }
}

export default async function BookingPage({ params }: Props) {
  const { businessSlug } = await params

  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: {
      services: { where: { isActive: true }, orderBy: { name: 'asc' } },
      staffMembers: {
        where: { isActive: true, staffServices: { some: {} } },
        select: { id: true, name: true, avatarUrl: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!business) notFound()

  const services = business.services.map(s => ({
    id: s.id, name: s.name, description: s.description,
    durationMins: s.durationMins, price: s.price ? Number(s.price) : null, color: s.color,
  }))

  const staffMembers = business.staffMembers.map(s => ({ id: s.id, name: s.name, avatarUrl: s.avatarUrl }))

  return (
    <div>
      <style>{`:root { --brand-primary: ${business.primaryColor ?? '#2D1B69'}; }`}</style>

      {/* Business header */}
      <div className="rounded-2xl mb-8 p-6" style={{ background: business.primaryColor ?? '#2D1B69' }}>
        {business.logoUrl && <img src={business.logoUrl} alt={business.name} className="h-10 object-contain mb-4" />}
        <h1 className="text-xl font-bold text-white">{business.name}</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Online booking — choose a service to get started</p>
        {business.websiteUrl && (
          <a href={business.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-block" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {business.websiteUrl.replace(/^https?:\/\//, '')} ↗
          </a>
        )}
      </div>

      <BookingWizard
        businessSlug={businessSlug}
        businessName={business.name}
        primaryColor={business.primaryColor ?? '#2D1B69'}
        services={services}
        staffMembers={staffMembers}
        singleStaff={staffMembers.length <= 1}
      />
    </div>
  )
}
