'use client'
import type { Service } from './BookingWizard'

type Props = { services: Service[]; onSelect: (service: Service) => void }

export default function ServicePicker({ services, onSelect }: Props) {
  if (services.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
        <p className="text-lg font-medium">No services available</p>
        <p className="text-sm mt-1">Please check back later.</p>
      </div>
    )
  }
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>Select a service</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Choose what you'd like to book.</p>
      <div className="space-y-3">
        {services.map((service) => (
          <button key={service.id} onClick={() => onSelect(service)}
            className="w-full text-left rounded-xl border transition-all duration-200 p-5 group"
            style={{ background: 'var(--white)', borderColor: 'var(--border)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(232,132,90,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {service.color && <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ background: service.color }}/>}
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>{service.name}</p>
                  {service.description && <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{service.description}</p>}
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{service.durationMins} min</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {service.price != null
                  ? <span className="font-bold" style={{ color: 'var(--purple-dark)' }}>${Number(service.price).toFixed(2)}</span>
                  : <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Quote</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
