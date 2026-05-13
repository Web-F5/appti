// src/lib/auth/session.ts
// Server-side helpers for getting the current session and business.
// Used by dashboard pages to replace the hardcoded BUSINESS_SLUG.

import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { redirect } from 'next/navigation'

/**
 * Get the current session on the server.
 * Redirects to /login if not authenticated.
 */
export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.businessSlug) redirect('/login')
  return session
}

/**
 * Get session without redirecting — returns null if not authenticated.
 * Use this for pages that are accessible without auth.
 */
export async function getSession() {
  return getServerSession(authOptions)
}
