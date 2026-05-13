'use client'
// src/components/dashboard/SettingsTabs.tsx
// Tabbed settings interface with sections for profile, booking rules,
// services, staff, and reminder templates.

import { useState } from 'react'
import BusinessProfileForm from './settings/BusinessProfileForm'
import BookingRulesForm from './settings/BookingRulesForm'
import ServicesManager from './settings/ServicesManager'
import StaffManager from './settings/StaffManager'
import RemindersManager from './settings/RemindersManager'

const TABS = [
  { key: 'profile',   label: 'Business profile' },
  { key: 'booking',   label: 'Booking rules'    },
  { key: 'services',  label: 'Services'         },
  { key: 'staff',     label: 'Staff'            },
  { key: 'reminders', label: 'Reminders'        },
]

type Props = { business: any }

export default function SettingsTabs({ business }: Props) {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background: 'var(--purple-light)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? 'var(--purple-dark)' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-mid)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile'   && <BusinessProfileForm business={business} />}
      {activeTab === 'booking'   && <BookingRulesForm business={business} />}
      {activeTab === 'services'  && <ServicesManager business={business} />}
      {activeTab === 'staff'     && <StaffManager business={business} />}
      {activeTab === 'reminders' && <RemindersManager business={business} />}
    </div>
  )
}
