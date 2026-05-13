// src/app/(dashboard)/layout.tsx
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/auth/SignOutButton'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { href: '/services',  label: 'Services',  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { href: '/staff',     label: 'Staff',     icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/clients',   label: 'Clients',   icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { href: '/billing',   label: 'Billing',   icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { href: '/reports',   label: 'Reports',   icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/settings',  label: 'Settings',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface)' }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col shrink-0" style={{ background: 'var(--purple-dark)' }}>

        {/* Logo */}
        <div className="h-16 flex items-center px-5 gap-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--orange)' }}>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span className="font-semibold text-white text-sm">
            {process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'}
          </span>
        </div>

        {/* Business name */}
        {session.user.businessName && (
          <div className="px-5 py-3" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Business</p>
            <p className="text-sm font-medium text-white truncate">{session.user.businessName}</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="nav-item">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/>
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User / sign out */}
        <div className="p-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs px-3 mb-1.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {session.user.email}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
