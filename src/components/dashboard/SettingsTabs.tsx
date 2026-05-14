'use client'
// src/components/dashboard/SettingsTabs.tsx

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const initialTab   = searchParams.get('tab') ?? 'profile'
  const [activeTab, setActiveTab] = useState(
    TABS.find(t => t.key === initialTab) ? initialTab : 'profile'
  )

  return (
    <div>
      {/* Tab bar — flex-wrap so it flows to 2 rows on mobile */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.key ? 'var(--purple-dark)' : 'var(--purple-light)',
              color:      activeTab === tab.key ? 'white' : 'var(--text-mid)',
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
