// src/app/(dashboard)/layout.tsx — Server component, fetches session
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/dashboard/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <DashboardShell
      businessName={session.user.businessName ?? ''}
      email={session.user.email ?? ''}
    >
      {children}
    </DashboardShell>
  )
}
