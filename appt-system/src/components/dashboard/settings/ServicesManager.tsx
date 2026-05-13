'use client'
// src/components/dashboard/settings/ServicesManager.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field, SaveButton, Toast, useToast } from './FormPrimitives'

const COLORS = ['#3b82f6','#10b981','#ef4444','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#64748b']

type Service = {
  id:          string
  name:        string
  description: string | null
  durationMins: number
  price:       number | null
  color:       string | null
  isActive:    boolean
  staffIds:    string[]
}

type Staff = { id: string; name: string }

function ServiceForm({
  initial,
  staff,
  onSave,
  onCancel,
  loading,
}: {
  initial:  Partial<Service>
  staff:    Staff[]
  onSave:   (data: any) => void
  onCancel: () => void
  loading:  boolean
}) {
  const [form, setForm] = useState({
    name:         initial.name         ?? '',
    description:  initial.description  ?? '',
    durationMins: initial.durationMins ?? 60,
    price:        initial.price != null ? String(initial.price) : '',
    color:        initial.color        ?? '#3b82f6',
    isActive:     initial.isActive     ?? true,
    staffIds:     initial.staffIds     ?? [],
  })

  function patch(updates: Partial<typeof form>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  function toggleStaff(id: string) {
    setForm(prev => ({
      ...prev,
      staffIds: prev.staffIds.includes(id)
        ? prev.staffIds.filter(s => s !== id)
        : [...prev.staffIds, id],
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      ...form,
      price: form.price !== '' ? Number(form.price) : null,
      durationMins: Number(form.durationMins),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-200">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Service name" id="svc-name" value={form.name}
            onChange={v => patch({ name: v })} required placeholder="e.g. Standard Inspection" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => patch({ description: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Brief description shown to clients"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            type="number" min={5} max={480} value={form.durationMins}
            onChange={e => patch({ durationMins: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (AUD)</label>
          <input
            type="number" min={0} step="0.01" value={form.price}
            onChange={e => patch({ price: e.target.value })}
            placeholder="Leave blank for quote"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Colour picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Calendar colour</label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => patch({ color: c })}
              className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Staff assignment */}
      {staff.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Assigned staff</label>
          <div className="flex flex-wrap gap-2">
            {staff.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStaff(s.id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                  form.staffIds.includes(s.id)
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

      <div className="flex gap-3 pt-2">
        <SaveButton loading={loading} />
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ServicesManager({ business }: { business: any }) {
  const router = useRouter()
  const { toast, showToast } = useToast()
  const [services, setServices] = useState<Service[]>(business.services ?? [])
  const [adding,   setAdding]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleCreate(data: any) {
    setLoading(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error ?? 'Failed to create service', 'error'); return }
      setServices(prev => [...prev, { ...json.data.service, staffIds: data.staffIds ?? [] }])
      setAdding(false)
      showToast('Service created')
      router.refresh()
    } catch { showToast('Network error', 'error') }
    finally { setLoading(false) }
  }

  async function handleUpdate(id: string, data: any) {
    setLoading(true)
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error ?? 'Failed to update', 'error'); return }
      setServices(prev => prev.map(s => s.id === id ? { ...json.data.service, staffIds: data.staffIds ?? [] } : s))
      setEditingId(null)
      showToast('Service updated')
      router.refresh()
    } catch { showToast('Network error', 'error') }
    finally { setLoading(false) }
  }

  async function handleToggleActive(service: Service) {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !service.isActive }),
      })
      if (!res.ok) { showToast('Failed to update', 'error'); return }
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !s.isActive } : s))
    } catch { showToast('Network error', 'error') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this service? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { showToast(json.error, 'error'); return }
      setServices(prev => prev.filter(s => s.id !== id))
      showToast('Service deleted')
    } catch { showToast('Network error', 'error') }
  }

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-2xl space-y-3">
        {services.map(service => (
          <div key={service.id}>
            {editingId === service.id ? (
              <ServiceForm
                initial={service}
                staff={business.staffMembers ?? []}
                onSave={data => handleUpdate(service.id, data)}
                onCancel={() => setEditingId(null)}
                loading={loading}
              />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: service.color ?? '#6366f1' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${service.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {service.durationMins} min
                    {service.price != null ? ` · $${service.price.toFixed(2)}` : ' · Quote'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggleActive(service)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-50">
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => setEditingId(service.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(service.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding ? (
          <ServiceForm
            initial={{}}
            staff={business.staffMembers ?? []}
            onSave={handleCreate}
            onCancel={() => setAdding(false)}
            loading={loading}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all"
          >
            + Add service
          </button>
        )}
      </div>
    </>
  )
}
