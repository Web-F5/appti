'use client'
// src/components/dashboard/settings/FormPrimitives.tsx
// Reusable form field components used across settings forms.

import { useState } from 'react'

// ── Toast notification ────────────────────────────────────────────────────────

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  return { toast, showToast }
}

export function Toast({ toast }: { toast: { message: string; type: 'success' | 'error' } | null }) {
  if (!toast) return null
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50,
      padding: '12px 16px', borderRadius: '12px',
      fontSize: '13px', fontWeight: 500,
      background: toast.type === 'success' ? 'var(--purple-dark)' : '#DC2626',
      color: 'white',
    }}>
      {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
    </div>
  )
}

// ── Field ─────────────────────────────────────────────────────────────────────

export function Field({
  label, id, type = 'text', value, onChange, placeholder, required, hint, disabled,
}: {
  label:       string
  id:          string
  type?:       string
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
  required?:   boolean
  hint?:       string
  disabled?:   boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={[
          'w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
          disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'border-gray-300 bg-white hover:border-gray-400',
        ].join(' ')}
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────

export function Toggle({
  label, description, checked, onChange,
}: {
  label:       string
  description?: string
  checked:     boolean
  onChange:    (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-blue-600' : 'bg-gray-200',
        ].join(' ')}
      >
        <span className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200',
          checked ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')} />
      </button>
    </div>
  )
}

// ── Number field ──────────────────────────────────────────────────────────────

export function NumberField({
  label, id, value, onChange, min, max, suffix, hint,
}: {
  label:   string
  id:      string
  value:   number
  onChange: (v: number) => void
  min?:    number
  max?:    number
  suffix?: string
  hint?:   string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          min={min}
          max={max}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

// ── Save button ───────────────────────────────────────────────────────────────

export function SaveButton({ loading, label = 'Save changes' }: { loading: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-primary"
      style={{ color: 'white', opacity: loading ? 0.6 : 1 }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      {title && <h3 className="text-base font-semibold text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  )
}
