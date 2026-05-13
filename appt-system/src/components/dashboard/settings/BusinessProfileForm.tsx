'use client'
// src/components/dashboard/settings/BusinessProfileForm.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field, SaveButton, Section, Toast, useToast } from './FormPrimitives'

const TIMEZONES = [
  { value: 'Australia/Sydney',    label: 'Sydney / Melbourne (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Australia/Brisbane',  label: 'Brisbane (AEST no DST)' },
  { value: 'Australia/Adelaide',  label: 'Adelaide (ACST)' },
  { value: 'Australia/Perth',     label: 'Perth (AWST)' },
  { value: 'Australia/Darwin',    label: 'Darwin (ACST no DST)' },
  { value: 'Australia/Hobart',    label: 'Hobart (AEST)' },
  { value: 'Pacific/Auckland',    label: 'New Zealand (NZST)' },
]

const COLOR_PRESETS = [
  { hex: '#2D1B69', label: 'Deep Purple'  },
  { hex: '#1E3A5F', label: 'Navy Blue'    },
  { hex: '#1A3D2B', label: 'Forest Green' },
  { hex: '#3D1F1F', label: 'Deep Red'     },
  { hex: '#1F2937', label: 'Slate'        },
  { hex: '#E8845A', label: 'Terracotta'   },
  { hex: '#3B82F6', label: 'Sky Blue'     },
  { hex: '#10B981', label: 'Emerald'      },
  { hex: '#F59E0B', label: 'Amber'        },
  { hex: '#8B5CF6', label: 'Violet'       },
  { hex: '#EC4899', label: 'Pink'         },
]

function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [hexInput, setHexInput] = useState(value)
  const [showCustom, setShowCustom] = useState(false)

  function handlePreset(hex: string) {
    onChange(hex)
    setHexInput(hex)
    setShowCustom(false)
  }

  function handleHexInput(raw: string) {
    setHexInput(raw)
    const clean = raw.startsWith('#') ? raw : `#${raw}`
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) onChange(clean)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {COLOR_PRESETS.map(preset => (
          <button
            key={preset.hex}
            type="button"
            title={preset.label}
            onClick={() => handlePreset(preset.hex)}
            className="w-8 h-8 rounded-lg transition-all duration-150"
            style={{
              background: preset.hex,
              outline: value === preset.hex ? `3px solid ${preset.hex}` : 'none',
              outlineOffset: '2px',
              transform: value === preset.hex ? 'scale(1.15)' : 'scale(1)',
            }}
          />
        ))}
        <button
          type="button"
          title="Custom colour"
          onClick={() => setShowCustom(s => !s)}
          className="w-8 h-8 rounded-lg border-2 border-dashed flex items-center justify-center transition-all"
          style={{ borderColor: showCustom ? 'var(--purple-mid)' : 'var(--border-strong)', color: 'var(--text-muted)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-2" style={{ background: 'var(--purple-soft)', border: '0.5px solid var(--border)' }}>
          <input
            type="color"
            value={value}
            onChange={e => { onChange(e.target.value); setHexInput(e.target.value) }}
            className="w-10 h-10 rounded-lg cursor-pointer p-0.5 border"
            style={{ borderColor: 'var(--border-strong)' }}
          />
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>#</span>
            <input
              type="text"
              maxLength={7}
              value={hexInput.replace(/^#/, '')}
              onChange={e => handleHexInput(e.target.value)}
              placeholder="2D1B69"
              className="flex-1 px-2 py-1.5 text-sm font-mono rounded-lg outline-none"
              style={{ border: '0.5px solid var(--border-strong)', background: 'var(--white)', color: 'var(--text-dark)' }}
            />
          </div>
          <div className="w-8 h-8 rounded-lg border shrink-0" style={{ background: value, borderColor: 'var(--border)' }} />
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Accent colour on your booking page · current: <span className="font-mono">{value}</span>
      </p>
    </div>
  )
}

export default function BusinessProfileForm({ business }: { business: any }) {
  const router = useRouter()
  const { toast, showToast } = useToast()

  const [form, setForm] = useState({
    name:         business.name         ?? '',
    websiteUrl:   business.websiteUrl   ?? '',
    primaryColor: business.primaryColor ?? '#2D1B69',
    timezone:     business.timezone     ?? 'Australia/Melbourne',
  })
  const [loading, setLoading] = useState(false)

  function patch(updates: Partial<typeof form>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  const websiteDisplay = form.websiteUrl.replace(/^https?:\/\//, '')

  function handleWebsiteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    patch({ websiteUrl: raw ? `https://${raw}` : '' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/businesses/${business.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         form.name,
          websiteUrl:   form.websiteUrl || null,
          primaryColor: form.primaryColor,
          timezone:     form.timezone,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? 'Save failed', 'error'); return }
      showToast('Profile saved')
      router.refresh()
    } catch {
      showToast('Network error', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Toast toast={toast} />
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <Section title="Business profile">
          <div className="space-y-4">
            <Field label="Business name" id="name" value={form.name} onChange={v => patch({ name: v })} required />

            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                Website URL
              </label>
              <div className="flex rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--border-strong)' }}>
                <span className="flex items-center px-3 text-sm font-mono shrink-0" style={{ background: 'var(--purple-soft)', color: 'var(--text-muted)', borderRight: '0.5px solid var(--border-strong)' }}>
                  https://
                </span>
                <input
                  id="websiteUrl"
                  type="text"
                  value={websiteDisplay}
                  onChange={handleWebsiteChange}
                  placeholder="yourbusiness.com.au"
                  className="flex-1 px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: 'var(--white)', color: 'var(--text-dark)' }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="timezone" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                Timezone
              </label>
              <select
                id="timezone"
                value={form.timezone}
                onChange={e => patch({ timezone: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                style={{ border: '0.5px solid var(--border-strong)', background: 'var(--white)', color: 'var(--text-dark)' }}
              >
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-dark)' }}>
                Booking page colour
              </label>
              <ColorPicker value={form.primaryColor} onChange={hex => patch({ primaryColor: hex })} />
            </div>
          </div>
        </Section>

        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            Booking page:{' '}
            <a href={`/book/${business.slug}`} target="_blank" className="font-mono text-xs" style={{ color: 'var(--orange)' }}>
              /book/{business.slug}
            </a>
          </p>
          <SaveButton loading={loading} />
        </div>
      </form>
    </>
  )
}
