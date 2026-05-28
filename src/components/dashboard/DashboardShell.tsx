'use client'
// src/components/dashboard/DashboardShell.tsx
// Client shell for the dashboard — handles mobile hamburger nav and active state.

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import SignOutButton from '@/components/auth/SignOutButton'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { href: '/services',  label: 'Services',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/staff',     label: 'Staff',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/clients',   label: 'Clients',   icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/billing',   label: 'Billing',   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href: '/reports',   label: 'Reports',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/settings',  label: 'Settings',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/help',      label: 'Help',      icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
]

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path}/>
    </svg>
  )
}

function CalendarIcon() {
  return (
    <img src="/logo.png" alt="Appti" style={{ height: 32, width: 'auto' }} />
  )
}

type Props = {
  children:     React.ReactNode
  businessName: string
  email:        string
}

export default function DashboardShell({ children, businessName, email }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: 'var(--surface)' }}>

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex w-56 flex-col shrink-0 sticky top-0 h-screen" style={{ background: 'var(--purple-dark)' }}>
        <div className="h-16 flex items-center px-5 gap-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
            <CalendarIcon/>
          <span className="font-semibold text-white text-sm">{appName}</span>
        </div>

        {businessName && (
          <div className="px-5 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Business</p>
            <p className="text-sm font-medium text-white truncate">{businessName}</p>
          </div>
        )}

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={{
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.6)',
                }}
              >
                <NavIcon path={item.icon}/>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs px-3 mb-1.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{email}</p>
          <SignOutButton/>
        </div>
      </aside>

      {/* ── Mobile topbar ────────────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14 shrink-0"
        style={{ background: 'var(--purple-dark)', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--orange)' }}>
            <CalendarIcon/>
          </div>
          <span className="font-semibold text-white text-sm">{businessName || appName}</span>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'white', background: mobileOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          )}
        </button>
      </div>

      {/* ── Mobile dropdown menu ─────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-x-0 top-14 bottom-0 z-50 flex flex-col overflow-auto"
          style={{ background: 'var(--purple-dark)' }}>
          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: active ? 'white' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  <NavIcon path={item.icon}/>
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="p-4" style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
            <p className="text-xs px-4 mb-2 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{email}</p>
            <SignOutButton/>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
