'use client'
// src/components/dashboard/settings/RemindersManager.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SaveButton, Toast, useToast } from './FormPrimitives'

type ReminderTemplate = {
  id:           string
  channel:      string
  offsetMins:   number
  subject:      string | null
  bodyTemplate: string
  isActive:     boolean
}

const TEMPLATE_VARS = [
  '{{client_name}}', '{{business_name}}', '{{service_name}}',
  '{{staff_name}}', '{{time}}', '{{date}}', '{{cancel_url}}',
]

function offsetLabel(mins: number): string {
  if (mins < 60)  return `${mins} minutes before`
  if (mins < 1440) return `${mins / 60} hour${mins / 60 > 1 ? 's' : ''} before`
  return `${mins / 1440} day${mins / 1440 > 1 ? 's' : ''} before`
}

function ReminderCard({
  template,
  onSave,
  onDelete,
}: {
  template: ReminderTemplate
  onSave:   (id: string, data: Partial<ReminderTemplate>) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [form, setForm]         = useState({
    offsetMins:   template.offsetMins,
    subject:      template.subject ?? '',
    bodyTemplate: template.bodyTemplate,
    isActive:     template.isActive,
  })

  function patch(updates: Partial<typeof form>) {
    setForm(prev => ({ ...prev, ...updates }))
  }

  async function handleSave() {
    setLoading(true)
    await onSave(template.id, {
      ...form,
      subject: form.subject || null,
    })
    setLoading(false)
    setEditing(false)
  }

  const channelIcon = template.channel === 'SMS' ? '📱' : '✉️'

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="text-lg">{channelIcon}</span>
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">
            {template.channel} — {offsetLabel(template.offsetMins)}
          </p>
          {!editing && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{template.bodyTemplate.slice(0, 60)}…</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${template.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
            {template.isActive ? 'Active' : 'Off'}
          </span>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
          >
            {editing ? 'Close' : 'Edit'}
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send</label>
              <select
                value={form.offsetMins}
                onChange={e => patch({ offsetMins: Number(e.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={120}>2 hours before</option>
                <option value={1440}>24 hours before</option>
                <option value={2880}>48 hours before</option>
                <option value={10080}>1 week before</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => patch({ isActive: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {template.channel === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject line</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => patch({ subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={form.bodyTemplate}
              onChange={e => patch({ bodyTemplate: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {TEMPLATE_VARS.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => patch({ bodyTemplate: form.bodyTemplate + v })}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded hover:bg-gray-200 font-mono"
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Click a variable to insert it into the message</p>
          </div>

          <div className="flex gap-3">
            <SaveButton loading={loading} />
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RemindersManager({ business }: { business: any }) {
  const router  = useRouter()
  const { toast, showToast } = useToast()
  const [templates, setTemplates] = useState<ReminderTemplate[]>(business.reminderTemplates ?? [])

  const plan       = business.plan ?? 'PAYG'
  const smsRate    = plan === 'PRO' ? '$0.060' : plan === 'STARTER' ? '$0.080' : '$0.120'
  const emailRate  = plan === 'PRO' ? '$0.0020' : plan === 'STARTER' ? '$0.0030' : '$0.0050'

  const billingNote = plan === 'PAYG'
    ? `Each message sent is charged directly to your credit balance — SMS: ${smsRate}/message (max 160 characters), Email: ${emailRate}/message.`
    : `Your ${plan} plan includes a monthly bundle of messages at no extra charge. Once your bundle is used up, additional messages are charged to your credit balance at SMS: ${smsRate}/message (max 160 characters), Email: ${emailRate}/message. Unused bundle messages do not roll over.`

  async function handleSave(id: string, data: Partial<ReminderTemplate>) {
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error ?? 'Save failed', 'error'); return }
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
      showToast('Reminder updated')
      router.refresh()
    } catch { showToast('Network error', 'error') }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reminder template?')) return
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Delete failed', 'error'); return }
      setTemplates(prev => prev.filter(t => t.id !== id))
      showToast('Reminder deleted')
    } catch { showToast('Network error', 'error') }
  }

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-2xl space-y-3">
        <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--purple-light)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--purple-dark)' }}>
            {plan} plan · message billing
          </p>
          <p className="text-sm" style={{ color: 'var(--text-mid)', lineHeight: 1.6 }}>
            {billingNote}
          </p>
        </div>

        {templates.map(template => (
          <ReminderCard
            key={template.id}
            template={template}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}

        {templates.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">
            No reminder templates configured. Add one to start sending reminders.
          </div>
        )}
      </div>
    </>
  )
}
