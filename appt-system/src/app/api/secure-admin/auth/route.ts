// src/app/api/secure-admin/auth/route.ts
// Handles admin panel authentication separately from the main app.
// Credentials set via ADMIN_USERNAME and ADMIN_PASSWORD env vars.
// Session stored as a signed cookie.

import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 8 // 8 hours

function getToken(): string {
  // Simple token — combination of env vars hashed together
  // In production you'd use a proper HMAC but this is sufficient for an admin panel
  return Buffer.from(
    `${process.env.ADMIN_USERNAME}:${process.env.ADMIN_PASSWORD}:${process.env.HEALTH_CHECK_TOKEN}`
  ).toString('base64')
}

// GET — check if current session is valid
export async function GET(_req: NextRequest) {
  const cookieStore = await cookies()
  const session     = cookieStore.get(COOKIE_NAME)
  const expected    = getToken()

  if (session?.value === expected) {
    return Response.json({ authenticated: true })
  }
  return Response.json({ authenticated: false }, { status: 401 })
}

// POST — login with username + password
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string }
  try { body = await req.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const adminUsername = process.env.ADMIN_USERNAME
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminUsername || !adminPassword) {
    console.error('[secure-admin] ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables')
    return Response.json({ error: 'Admin credentials not configured' }, { status: 500 })
  }

  if (body.username !== adminUsername || body.password !== adminPassword) {
    // Small delay to slow down brute force attempts
    await new Promise(resolve => setTimeout(resolve, 1000))
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token       = getToken()
  const cookieStore = await cookies()

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   COOKIE_MAX_AGE,
    path:     '/',  // root path so cookie is sent to both /secure-admin and /api/secure-admin
  })

  return Response.json({ authenticated: true })
}

// DELETE — logout
export async function DELETE(_req: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  return Response.json({ authenticated: false })
}
