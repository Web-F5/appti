'use client'
import type { Service, TimeSlot } from './BookingWizard'

type Props = { service: Service; slot: TimeSlot; clientName: string; staffMemberName: string; businessName: string; appointmentId: string }

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) { return new Date(iso).toLocaleDateString('en-AU', opts) }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) }

export default function Confirmation({ service, slot, clientName, staffMemberName, businessName, appointmentId }: Props) {
  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'var(--purple-light)' }}>
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--purple-dark)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>You're booked, {clientName.split(' ')[0]}!</h2>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>A confirmation has been sent to your email with a calendar invite.</p>

      <div className="rounded-2xl p-6 text-left max-w-sm mx-auto mb-6" style={{ background: 'var(--purple-soft)', border: '0.5px solid var(--border)' }}>
        <div className="space-y-3.5">
          {[
            { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', label: 'Service', value: service.name },
            { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Date', value: fmt(slot.startsAt, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
            { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Time', value: `${fmtTime(slot.startsAt)} — ${fmtTime(slot.endsAt)}` },
            ...(staffMemberName ? [{ icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', label: 'With', value: staffMemberName }] : []),
            ...(service.price != null ? [{ icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Price', value: `$${Number(service.price).toFixed(2)}` }] : []),
          ].map(row => (
            <div key={row.label} className="flex items-start gap-3">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--purple-mid)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={row.icon}/>
              </svg>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{row.label}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-dark)' }}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Reference: <span className="font-mono">{appointmentId.slice(0, 8).toUpperCase()}</span>
      </p>
      <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
        Need to cancel? Reply to your confirmation email or contact {businessName} directly.
      </p>
    </div>
  )
}
