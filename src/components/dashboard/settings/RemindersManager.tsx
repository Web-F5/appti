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

const OFFSET_OPTIONS = [
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before',     value: 60 },
  { label: '2 hours before',    value: 120 },
  { label: '3 hours before',    value: 180 },
  { label: '12 hours before',   value: 720 },
  { label: '24 hours before',   value: 1440 },
  { label: '48 hours before',   value: 2880 },
  { label: '1 week before',     value: 10080 },
]

function offsetLabel(mins: number): string {
  const opt = OFFSET_OPTIONS.find(o => o.value === mins)
  if (opt) return opt.label
  if (mins < 60)   return `${mins} minutes before`
  if (mins < 1440) return `${mins / 60} hour${mins / 60 > 1 ? 's' : ''} before`
  return `${mins / 1440} day${mins / 1440 > 1 ? 's' : ''} before`
}

const DEFAULT_SMS   = 'Reminder: {{service_name}} with {{business_name}} at {{time}} on {{date}}. Cancel: {{cancel_url}}'
const DEFAULT_EMAIL = 'Hi {{client_name}},\n\nThis is a reminder that you have an appointment for {{service_name}} at {{time}} on {{date}}.\n\nNeed to cancel? {{cancel_url}}\n\nSee you soon,\n{{business_name}}'

// ── Add reminder form ─────────────────────────────────────────────────────────

function AddReminderForm({ onSave, onCancel, loading }: {
  onSave:   (data: Partial<ReminderTemplate>) => void
  onCancel: () => void
  loading:  boolean
}) {
  const [form, setForm] = useState({
    channel:      'SMS' as 'SMS' | 'EMAIL',
    offsetMins:   1440,
    subject:      'Reminder: Your appointment with {{business_name}}',
    bodyTemplate: DEFAULT_SMS,
    isActive:     true,
  })

  function patch(u: Partial<typeof form>) {
    setForm(p => {
      const next = { ...p, ...u }
      // Auto-set default body when channel changes
      if (u.channel) {
        next.bodyTemplate = u.channel === 'SMS' ? DEFAULT_SMS : DEFAULT_EMAIL
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ ...form, subject: form.channel === 'EMAIL' ? form.subject : null })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-xl" style={{ background: 'var(--purple-soft)', border: '0.5px solid var(--border)' }}>
      <h3 className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>New reminder</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>Channel</label>
          <div className="flex gap-2">
            {(['SMS', 'EMAIL'] as const).map(ch => (
              <button key={ch} type="button" onClick={() => patch({ channel: ch })}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: form.channel === ch ? 'var(--purple-dark)' : 'var(--white)',
                  color: form.channel === ch ? 'white' : 'var(--text-muted)',
                  border: '0.5px solid var(--border-strong)',
                }}>
                {ch === 'SMS' ? '📱 SMS' : '✉️ Email'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>Send when</label>
          <select value={form.offsetMins} onChange={e => patch({ offsetMins: Number(e.target.value) })}
            className="input">
            {OFFSET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {form.channel === 'EMAIL' && (
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>Subject line</label>
          <input type="text" value={form.subject} onChange={e => patch({ subject: e.target.value })} className="input" />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>Message</label>
        <textarea value={form.bodyTemplate} onChange={e => patch({ bodyTemplate: e.target.value })}
          rows={form.channel === 'EMAIL' ? 6 : 3}
          className="input font-mono text-xs"
          style={{ resize: 'vertical' }}
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {TEMPLATE_VARS.map(v => (
            <button key={v} type="button"
              onClick={() => patch({ bodyTemplate: form.bodyTemplate + v })}
              className="text-xs px-2 py-0.5 rounded font-mono"
              style={{ background: 'var(--purple-light)', color: 'var(--purple-dark)' }}>
              {v}
            </button>
          ))}
        </div>
        {form.channel === 'SMS' && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {form.bodyTemplate.length} characters — max 160 per SMS segment
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <SaveButton loading={loading} label="Add reminder" />
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium"
          style={{ color: 'var(--text-muted)' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Reminder card ─────────────────────────────────────────────────────────────

function ReminderCard({ template, onSave, onDelete }: {
  template: ReminderTemplate
  onSave:   (id: string, data: Partial<ReminderTemplate>) => Promise<void>
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({
    offsetMins:   template.offsetMins,
    subject:      template.subject ?? '',
    bodyTemplate: template.bodyTemplate,
    isActive:     template.isActive,
  })

  function patch(u: Partial<typeof form>) { setForm(p => ({ ...p, ...u })) }

  async function handleSave() {
    setLoading(true)
    await onSave(template.id, { ...form, subject: template.channel === 'EMAIL' ? form.subject : null })
    setLoading(false)
    setEditing(false)
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4">
        <span className="text-lg">{template.channel === 'SMS' ? '📱' : '✉️'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm" style={{ color: 'var(--text-dark)' }}>
            {template.channel} — {offsetLabel(template.offsetMins)}
          </p>
          {!editing && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {template.bodyTemplate.slice(0, 70)}{template.bodyTemplate.length > 70 ? '…' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="badge" style={{
            background: template.isActive ? '#D1FAE5' : 'var(--surface)',
            color: template.isActive ? '#065F46' : 'var(--text-muted)',
          }}>
            {template.isActive ? 'Active' : 'Off'}
          </span>
          <button onClick={() => setEditing(!editing)}
            className="text-xs px-2 py-1 rounded"
            style={{ color: 'var(--orange)' }}>
            {editing ? 'Close' : 'Edit'}
          </button>
          <button onClick={() => onDelete(template.id)}
            className="text-xs px-2 py-1 rounded"
            style={{ color: '#DC2626' }}>
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div className="px-5 pb-5 pt-2 space-y-4" style={{ borderTop: '0.5px solid var(--border)', background: 'var(--surface)' }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dark)' }}>Send when</label>
              <select value={form.offsetMins} onChange={e => patch({ offsetMins: Number(e.target.value) })}
                className="input">
                {OFFSET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input type="checkbox" checked={form.isActive} onChange={e => patch({ isActive: e.target.checked })}
                  className="rounded" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-dark)' }}>Active</span>
              </label>
            </div>
          </div>

          {template.channel === 'EMAIL' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dark)' }}>Subject</label>
              <input type="text" value={form.subject} onChange={e => patch({ subject: e.target.value })} className="input" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-dark)' }}>Message</label>
            <textarea value={form.bodyTemplate} onChange={e => patch({ bodyTemplate: e.target.value })}
              rows={template.channel === 'EMAIL' ? 6 : 3}
              className="input font-mono text-xs"
              style={{ resize: 'vertical' }}
            />
            <div className="mt-2 flex flex-wrap gap-1">
              {TEMPLATE_VARS.map(v => (
                <button key={v} type="button"
                  onClick={() => patch({ bodyTemplate: form.bodyTemplate + v })}
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ background: 'var(--purple-light)', color: 'var(--purple-dark)' }}>
                  {v}
                </button>
              ))}
            </div>
            {template.channel === 'SMS' && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {form.bodyTemplate.length} characters — max 160 per SMS segment
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={loading}
              className="btn-primary" style={{ color: 'white', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RemindersManager({ business }: { business: any }) {
  const router  = useRouter()
  const { toast, showToast } = useToast()
  const [templates, setTemplates] = useState<ReminderTemplate[]>(business.reminderTemplates ?? [])
  const [adding,    setAdding]    = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const plan      = business.plan ?? 'PAYG'
  const smsRate   = plan === 'PRO'
    ? (process.env.NEXT_PUBLIC_RATE_SMS_PRO     ?? '0.060')
    : plan === 'STARTER'
    ? (process.env.NEXT_PUBLIC_RATE_SMS_STARTER ?? '0.080')
    : (process.env.NEXT_PUBLIC_RATE_SMS_PAYG    ?? '0.120')
  const emailRate = plan === 'PRO'
    ? (process.env.NEXT_PUBLIC_RATE_EMAIL_PRO     ?? '0.0020')
    : plan === 'STARTER'
    ? (process.env.NEXT_PUBLIC_RATE_EMAIL_STARTER ?? '0.0030')
    : (process.env.NEXT_PUBLIC_RATE_EMAIL_PAYG    ?? '0.0050')

  const billingNote = plan === 'PAYG'
    ? `Each message is charged to your credit balance — SMS: $${smsRate}/msg (max 160 chars), Email: $${emailRate}/msg.`
    : `Your ${plan} plan includes a monthly bundle. Once exhausted, additional messages are charged at SMS: $${smsRate}/msg (max 160 chars), Email: $${emailRate}/msg. Unused bundle messages do not roll over.`

  async function handleAdd(data: Partial<ReminderTemplate>) {
    setAddLoading(true)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { showToast(json.error ?? 'Failed to add reminder', 'error'); return }
      setTemplates(prev => [...prev, json.data.template])
      setAdding(false)
      showToast('Reminder added')
      router.refresh()
    } catch { showToast('Network error', 'error') }
    finally { setAddLoading(false) }
  }

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
    if (!confirm('Delete this reminder? Clients will no longer receive this message before appointments.')) return
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      if (!res.ok) { showToast('Delete failed', 'error'); return }
      setTemplates(prev => prev.filter(t => t.id !== id))
      showToast('Reminder deleted')
    } catch { showToast('Network error', 'error') }
  }

  // Group by channel for display
  const smsTemplates   = templates.filter(t => t.channel === 'SMS')
  const emailTemplates = templates.filter(t => t.channel === 'EMAIL')

  return (
    <>
      <Toast toast={toast} />
      <div className="max-w-2xl space-y-4">

        {/* Billing note */}
        <div className="rounded-xl p-4" style={{ background: 'var(--purple-light)', border: '0.5px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--purple-dark)' }}>
            {plan} plan · message billing
          </p>
          <p className="text-sm" style={{ color: 'var(--text-mid)', lineHeight: 1.6 }}>{billingNote}</p>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Add as many reminders as you like — mix SMS and email, at different times before each appointment.
          All active reminders are sent automatically for every confirmed booking.
        </p>

        {/* SMS reminders */}
        {smsTemplates.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>📱 SMS reminders</p>
            <div className="space-y-2">
              {smsTemplates.map(t => (
                <ReminderCard key={t.id} template={t} onSave={handleSave} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Email reminders */}
        {emailTemplates.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>✉️ Email reminders</p>
            <div className="space-y-2">
              {emailTemplates.map(t => (
                <ReminderCard key={t.id} template={t} onSave={handleSave} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {templates.length === 0 && !adding && (
          <div className="text-center py-10" style={{ color: 'var(--text-muted)' }}>
            <p className="text-sm">No reminders configured yet.</p>
            <p className="text-xs mt-1">Add your first reminder below.</p>
          </div>
        )}

        {/* Add form */}
        {adding ? (
          <AddReminderForm
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
            loading={addLoading}
          />
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{ border: '2px dashed var(--border-strong)', color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-muted)' }}
          >
            + Add reminder
          </button>
        )}
      </div>
    </>
  )
}
