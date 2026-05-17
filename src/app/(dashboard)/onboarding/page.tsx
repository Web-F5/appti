// src/app/(dashboard)/onboarding/page.tsx
// Shown to new users to guide them through initial setup.
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma/client'

export const metadata: Metadata = { title: 'Get started' }

export default async function OnboardingPage() {
  const session  = await requireSession()
  const business = await prisma.business.findUnique({
    where: { slug: session.user.businessSlug },
    include: {
      services:     { take: 1 },
      staffMembers: { take: 1 },
    },
  })
  if (!business) return null

  const steps = [
    {
      num:     1,
      title:   'Set up your business profile',
      desc:    'Add your business name, brand colour, and website so your booking page looks professional.',
      href:    '/settings?tab=profile',
      cta:     'Edit profile',
      done:    !!business.websiteUrl || !!business.primaryColor,
    },
    {
      num:     2,
      title:   'Add your services',
      desc:    'Create at least one service with a name, duration, and price. Clients will choose from these when booking.',
      href:    '/settings?tab=services',
      cta:     'Add a service',
      done:    business.services.length > 0,
    },
    {
      num:     3,
      title:   'Add staff and availability',
      desc:    'Add yourself as a staff member and set your weekly hours so clients can see when you\'re available.',
      href:    '/settings?tab=staff',
      cta:     'Add staff',
      done:    business.staffMembers.length > 0,
    },
    {
      num:     4,
      title:   'Configure reminders',
      desc:    'Set up automatic SMS and email reminders to reduce no-shows. You control the timing and message content.',
      href:    '/settings?tab=reminders',
      cta:     'Set up reminders',
      done:    false,
    },
    {
      num:     5,
      title:   'Share your booking page',
      desc:    'Your booking page is live! Share the link with clients via your website, email signature, or social media.',
      href:    `/book/${business.slug}`,
      cta:     'View booking page',
      done:    false,
      external: true,
    },
    {
      num:     6,
      title:   'Top up your credits',
      desc:    'Add credits to your account so reminders can be sent. You only pay for messages actually delivered.',
      href:    '/billing',
      cta:     'Add credits',
      done:    Number(business.creditBalance) > 0,
    },
  ]

  const completedCount = steps.filter(s => s.done).length

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>
          Welcome to {process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'}! 🎉
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Complete these steps to get your booking system ready for clients.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / steps.length) * 100}%`, background: 'var(--orange)' }} />
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {completedCount}/{steps.length} done
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map(step => (
          <div key={step.num} className="card p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{
                background: step.done ? '#D1FAE5' : 'var(--purple-light)',
                color: step.done ? '#065F46' : 'var(--purple-dark)',
              }}>
              {step.done ? '✓' : step.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: step.done ? 'var(--text-muted)' : 'var(--text-dark)', textDecoration: step.done ? 'line-through' : 'none' }}>
                {step.title}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
            </div>
            {!step.done && (
              <Link href={step.href} target={step.external ? '_blank' : undefined}
                className="btn-primary shrink-0 text-xs px-3 py-2"
                style={{ color: 'white', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {step.cta}
              </Link>
            )}
          </div>
        ))}
      </div>

      {completedCount === steps.length && (
        <div className="mt-8 rounded-2xl p-8 text-center" style={{ background: 'var(--purple-dark)' }}>
          <p className="text-2xl mb-2">🚀</p>
          <h3 className="text-lg font-bold text-white mb-2">You&apos;re all set!</h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Your booking system is ready. Share your booking link and start taking appointments.
          </p>
          <Link href="/dashboard" className="btn-primary" style={{ color: 'white', textDecoration: 'none' }}>
            Go to dashboard →
          </Link>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Skip for now — go to dashboard →
        </Link>
      </div>
    </div>
  )
}
