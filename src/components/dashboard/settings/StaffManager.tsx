'use client'
// src/components/dashboard/settings/StaffManager.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field, SaveButton, Toast, useToast } from './FormPrimitives'

const DAYS = [
  { key: 'MONDAY',    label: 'Mon' },
  { key: 'TUESDAY',   label: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wed' },
  { key: 'THURSDAY',  label: 'Thu' },
  { key: 'FRIDAY',    label: 'Fri' },
  { key: 'SATURDAY',  label: 'Sat' },
  { key: 'SUNDAY',    label: 'Sun' },
]

type AvailabilityRule = { dayOfWeek: string; startTime: string; endTime: string }

type StaffMember = {
  id:               string
  name:             string
  email:            string
  phone:            string | null
  isActive:         boolean
  availabilityRules: AvailabilityRule[]
  staffServices:    { service: { id: string; name: string } }[]
}

function StaffForm({
  initial,
  services,
  onSave,
  onCancel,
  loading,
}: {
  initial:  Partial<StaffMember>
  services: { id: string; name: string }[]
  onSave:   (data: any) => void
  onCancel: () => void
  loading:  boolean
}) {
  const [form, setForm] = useState({
    name:     initial.name     ?? '',
    email:    initial.email    ?? '',
    phone:    initial.phone    ?? '',
    isActive: initial.isActive ?? true,
    serviceIds: initial.staffServices?.map(ss => ss.service.id) ?? [],
    availabilityRules: initial.availabilityRules ?? [] as AvailabilityRule[],
  })

  function patch(updates: Partial<typeof form>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  function toggleService(id: string) {
    setForm(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter(s => s !== id)
        : [...prev.serviceIds, id],
    }))
  }

  function toggleDay(day: string) {
    setForm(prev => {
      const exists = prev.availabilityRules.find(r => r.dayOfWeek === day)
      if (exists) {
        return { ...prev, availabilityRules: prev.availabilityRules.filter(r => r.dayOfWeek !== day) }
      }
      return {
        ...prev,
        availabilityRules: [...prev.availabilityRules, { dayOfWeek: day, startTime: '09:00', endTime: '17:00' }],
      }
    })
  }

  function updateRule(day: string, field: 'startTime' | 'endTime', value: string) {
    setForm(prev => ({
      ...prev,
      availabilityRules: prev.availabilityRules.map(r =>
        r.dayOfWeek === day ? { ...r, [field]: value } : r
      ),
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...form, phone: form.phone || null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Full name" id="staff-name" value={form.name}
            onChange={v => patch({ name: v })} required />
        </div>
        <Field label="Email" id="staff-email" type="email" value={form.email}
          onChange={v => patch({ email: v })} required />
        <Field label="Phone" id="staff-phone" type="tel" value={form.phone ?? ''}
          onChange={v => patch({ phone: v })} placeholder="0412 345 678" />
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Services offered</label>
          <div className="flex flex-wrap gap-2">
            {services.map(s => (
              <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  form.serviceIds.includes(s.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                ].join(' ')}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Weekly availability</label>
        <div className="space-y-2">
          {DAYS.map(day => {
            const rule = form.availabilityRules.find(r => r.dayOfWeek === day.key)
            return (
              <div key={day.key} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(day.key)}
                  className={[
                    'w-12 py-1 rounded-lg text-xs font-semibold border transition-all shrink-0',
                    rule
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-400 border-gray-200',
                  ].join(' ')}
                >
                  {day.label}
                </button>
                {rule && (
                  <div className="flex items-center gap-2 text-sm">
                    <input
                      type="time" value={rule.startTime}
                      onChange={e => updateRule(day.key, 'startTime', e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time" value={rule.endTime}
                      onChange={e => updateRule(day.key, 'endTime', e.target.value)}
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <SaveButton loading={loading} />
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function StaffManager({ business }: { business: any }) {
  const router = useRouter()
  const { toast, showToast } = useToast()
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loaded, setLoaded]       = useState(false)
  const [adding,  setAdding]      = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  // Lazy load full staff data on first render
  useState(() => {
    fetch('/api/staff')
      .then(r => r.json())
      .then(d => { setStaffList(d.data?.staff ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  })

  async function handleCreate(data: any) {
    setLoading(true)
    try {
      const res = await fetch('/api/staff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error ?? 'Failed to create', 'error'); return }
      setAdding(false)
      showToast('Staff member added')
      // Reload the list
      const r = await fetch('/api/staff')
      const d = await r.json()
      setStaffList(d.data?.staff ?? [])
      router.refresh()
    } catch { showToast('Network error', 'error') }
    finally { setLoading(false) }
  }

  async function handleUpdate(id: string, data: any) {
    setLoading(true)
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error ?? 'Failed to update', 'error'); return }
      setEditingId(null)
      showToast('Staff member updated')
      const r = await fetch('/api/staff')
      const d = await r.json()
      setStaffList(d.data?.staff ?? [])
      router.refresh()
    } catch { showToast('Network error', 'error') }
    finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this staff member?')) return
    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { showToast(json.error, 'error'); return }
      setStaffList(prev => prev.filter(s => s.id !== id))
      showToast('Staff member removed')
      router.refresh()
    } catch { showToast('Network error', 'error') }
  }

  if (!loaded) {
    return <div className="text-sm text-gray-400 py-8 text-center">Loading staff…</div>
  }

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-2xl space-y-3">
        {staffList.map(member => (
          <div key={member.id}>
            {editingId === member.id ? (
              <StaffForm
                initial={member}
                services={business.services ?? []}
                onSave={data => handleUpdate(member.id, data)}
                onCancel={() => setEditingId(null)}
                loading={loading}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                  {member.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {member.availabilityRules.length} availability rules ·{' '}
                    {member.staffServices.length} services
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setEditingId(member.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(member.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <StaffForm
            initial={{}}
            services={business.services ?? []}
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
            loading={loading}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
          >
            + Add staff member
          </button>
        )}
      </div>
    </>
  )
}
