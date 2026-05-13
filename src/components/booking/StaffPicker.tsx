'use client'
// src/components/booking/StaffPicker.tsx
// Step 2 (optional) — client selects which staff member they'd like.
// Skipped entirely for sole-trader businesses.

import type { Service, StaffMember } from './BookingWizard'

type Props = {
  staffMembers: StaffMember[]
  service:      Service
  onSelect:     (staff: StaffMember) => void
  onBack:       () => void
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-12 h-12 rounded-full object-cover"
      />
    )
  }
  // Initials fallback
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
      {initials}
    </div>
  )
}

export default function StaffPicker({ staffMembers, service, onSelect, onBack }: Props) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      <h2 className="text-xl font-semibold text-gray-900 mb-1">Choose a staff member</h2>
      <p className="text-sm text-gray-500 mb-6">
        For <span className="font-medium text-gray-700">{service.name}</span>
      </p>

      <div className="space-y-3">
        {/* Any available option */}
        <button
          onClick={() => onSelect({ id: 'any', name: 'Any available', avatarUrl: null })}
          className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Any available
              </p>
              <p className="text-sm text-gray-400">Show all available times</p>
            </div>
            <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </button>

        {staffMembers.map((staff) => (
          <button
            key={staff.id}
            onClick={() => onSelect(staff)}
            className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center gap-4">
              <Avatar name={staff.name} avatarUrl={staff.avatarUrl} />
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {staff.name}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
