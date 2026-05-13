// src/app/api/webhooks/test/route.ts
// Temporary debug endpoint — DELETE after webhook is working
// Test with: curl http://localhost:3000/api/webhooks/test

import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  return Response.json({ message: 'Webhook endpoint reachable', timestamp: new Date().toISOString() })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  console.log('[Webhook Test] POST received, body length:', body.length)
  console.log('[Webhook Test] Headers:', Object.fromEntries(req.headers.entries()))
  return Response.json({ received: true, bodyLength: body.length })
}
