// src/app/(dashboard)/dashboard/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth/session'
import { getBusinessBySlug, getDashboardStats, getUpcomingAppointments, getTodaysAppointments } from '@/lib/dashboard/queries'
import { formatInTz } from '@/lib/utils'

export const metadata: Metadata = { title: 'Dashboard' }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    CONFIRMED: 'badge-confirmed', PENDING: 'badge-pending',
    COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled', NO_SHOW: 'badge-noshow',
  }
  return (
    <span className={`badge ${map[status] ?? 'badge-completed'}`}>
      {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
    </span>
  )
}

export default async function DashboardPage() {
  const session  = await requireSession()
  const business = await getBusinessBySlug(session.user.businessSlug)
  if (!business) return <div className="text-gray-500">Business not found.</div>

  const [stats, upcoming, today] = await Promise.all([
    getDashboardStats(business.id, business.timezone),
    getUpcomingAppointments(business.id, 8),
    getTodaysAppointments(business.id, business.timezone),
  ])

  const dateLabel = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-dark)' }}>
            Good {getTimeOfDay()}, {session.user.name?.split(' ')[0] ?? 'there'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{dateLabel} · {business.name}</p>
        </div>
        <Link href={`/book/${business.slug}`} target="_blank" className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          View booking page
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card featured">
          <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Today</p>
          <p className="text-3xl font-semibold text-white">{stats.appointmentsToday}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>appointments</p>
        </div>
        <div className="stat-card">
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>This week</p>
          <p className="text-3xl font-semibold" style={{ color: 'var(--text-dark)' }}>{stats.appointmentsThisWeek}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>appointments</p>
        </div>
        <div className="stat-card">
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Clients</p>
          <p className="text-3xl font-semibold" style={{ color: 'var(--text-dark)' }}>{stats.totalClients}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>+{stats.newClientsThisMonth} this month</p>
        </div>
        <div className="stat-card" style={{ borderColor: stats.creditBalance < 2 ? '#FCA5A5' : undefined, background: stats.creditBalance < 2 ? '#FEF2F2' : undefined }}>
          <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Credits</p>
          <p className="text-3xl font-semibold" style={{ color: stats.creditBalance < 2 ? '#DC2626' : 'var(--text-dark)' }}>
            ${stats.creditBalance.toFixed(2)}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stats.plan} plan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: schedules */}
        <div className="lg:col-span-2 space-y-6">

          {/* Today */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Today's schedule</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{today.length} appointment{today.length !== 1 ? 's' : ''}</span>
            </div>
            {today.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14" style={{ color: 'var(--text-muted)' }}>
                <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="text-sm">No appointments today</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {today.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-opacity-50 transition-colors" style={{ '--tw-bg-opacity': '1' } as any}>
                    <div className="w-14 shrink-0 text-center">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                        {formatInTz(appt.startsAt, business.timezone, 'h:mm')}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatInTz(appt.startsAt, business.timezone, 'a')}
                      </p>
                    </div>
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: appt.serviceColor ?? 'var(--purple-mid)' }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-dark)' }}>{appt.clientName}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{appt.serviceName} · {appt.durationMins} min</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Upcoming</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Next {upcoming.length}</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="px-5 py-10 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No upcoming appointments</p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {upcoming.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors">
                    <div className="w-20 shrink-0">
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                        {formatInTz(appt.startsAt, business.timezone, 'EEE d MMM')}
                      </p>
                      <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-dark)' }}>
                        {formatInTz(appt.startsAt, business.timezone, 'h:mm a')}
                      </p>
                    </div>
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: appt.serviceColor ?? 'var(--purple-mid)' }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-dark)' }}>{appt.clientName}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{appt.serviceName} · with {appt.staffName}</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Balance card */}
          <div className="rounded-xl p-5" style={{ background: 'var(--purple-dark)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Credit balance</p>
            <p className="text-3xl font-semibold text-white">${stats.creditBalance.toFixed(2)}</p>
            <p className="text-xs mt-1 mb-4" style={{ color: 'var(--blue-light)' }}>{stats.plan} plan</p>
            <Link href="/billing" className="btn-primary text-xs px-3 py-2 text-white" style={{ background: 'var(--orange)', color: 'white' }}>
              Manage billing
            </Link>
          </div>

          {/* Usage */}
          <div className="card p-5">
            <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-dark)' }}>This month</p>
            <div className="space-y-3">
              {[
                { label: 'SMS sent',   value: stats.smsThisMonth,   color: 'var(--blue-light)' },
                { label: 'Emails',     value: stats.emailThisMonth, color: 'var(--purple-mid)' },
                { label: 'All time',   value: stats.appointmentsTotal, color: 'var(--orange)' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }}/>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="card p-4">
            <p className="text-sm font-semibold mb-3 px-1" style={{ color: 'var(--text-dark)' }}>Quick actions</p>
            <div className="space-y-0.5">
              {[
                { href: '/services', label: 'Manage services' },
                { href: '/staff',    label: 'Manage staff'    },
                { href: '/clients',  label: 'View clients'    },
                { href: '/settings', label: 'Settings'        },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors hover:bg-purple-50"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {link.label}
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
