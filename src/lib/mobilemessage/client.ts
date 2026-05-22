// src/lib/mobilemessage/client.ts
// Mobile Message SMS client — Australian provider, direct carrier routing.
// API docs: https://mobilemessage.com.au/api-documentation
// Auth: Basic Auth (Base64 encoded username:password)
// No SDK needed — plain fetch with JSON.

// Credentials checked lazily inside sendSms() — allows running without SMS configured

const API_BASE = 'https://api.mobilemessage.com.au/v1'

// Build Basic Auth header once at startup
const AUTH_HEADER = 'Basic ' + Buffer.from(
  `${process.env.MOBILEMESSAGE_USERNAME}:${process.env.MOBILEMESSAGE_PASSWORD}`
).toString('base64')

// Sender ID — either your registered alphanumeric brand name (e.g. "BookEasy")
// or your dedicated virtual mobile number assigned by Mobile Message.
// Must be registered with ACMA Sender ID Register before use as a brand name.
const SENDER_ID = process.env.MOBILEMESSAGE_SENDER_ID ?? ''

// ── Types ─────────────────────────────────────────────────────────────────────

export type SmsResult = {
  success: boolean
  providerMsgId?: string
  error?: string
}

type MobileMessageResponse = {
  message_id?: string
  status?: string
  error?: string
  messages?: Array<{
    message_id: string
    status: string
    to: string
  }>
}

// ── Send SMS ──────────────────────────────────────────────────────────────────

/**
 * Send a single SMS via Mobile Message.
 * Returns success/failure with the provider message ID — never throws.
 *
 * Phone numbers should be in E.164 format: +61412345678
 * The normalisePhone() util in src/lib/utils handles AU number formatting.
 */

export async function sendSms(to: string, body: string): Promise<{ success: boolean; providerMsgId?: string; error?: string }> {
  // Skip SMS if credentials not configured
  if (!process.env.MOBILEMESSAGE_USERNAME || !process.env.MOBILEMESSAGE_PASSWORD) {
    console.log('[MobileMessage] SMS credentials not configured — skipping SMS')
    return { success: false, error: 'SMS not configured' }
  }
  try {
    const payload = {
      messages: [
        {
          to,
          body,
          // Only include from if a sender ID is configured
          ...(SENDER_ID ? { from: SENDER_ID } : {}),
        },
      ],
    }

    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[MobileMessage] HTTP ${response.status}:`, errorText)
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    const data: MobileMessageResponse = await response.json()

    // Extract message ID from response
    const msgId = data.message_id ?? data.messages?.[0]?.message_id

    return { success: true, providerMsgId: msgId }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown Mobile Message error'
    console.error('[MobileMessage] SMS send failed:', error)
    return { success: false, error }
  }
}

// ── Send bulk SMS ─────────────────────────────────────────────────────────────

/**
 * Send up to 100 SMS messages in a single API call.
 * More efficient than calling sendSms() in a loop for batch operations.
 */
export async function sendBulkSms(
  messages: Array<{ to: string; body: string }>
): Promise<SmsResult[]> {
  if (messages.length === 0) return []
  if (messages.length > 100) {
    throw new Error('Mobile Message API supports a maximum of 100 messages per request')
  }

  try {
    const payload = {
      messages: messages.map((msg) => ({
        to: msg.to,
        body: msg.body,
        ...(SENDER_ID ? { from: SENDER_ID } : {}),
      })),
    }

    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // Return failure for all messages in the batch
      return messages.map(() => ({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      }))
    }

    const data: MobileMessageResponse = await response.json()

    // Map results back to individual SmsResult objects
    return (data.messages ?? []).map((msg) => ({
      success: msg.status !== 'failed',
      providerMsgId: msg.message_id,
    }))
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown Mobile Message error'
    console.error('[MobileMessage] Bulk SMS send failed:', error)
    return messages.map(() => ({ success: false, error }))
  }
}

// ── Check credit balance ──────────────────────────────────────────────────────

/**
 * Returns the current SMS credit balance on the Mobile Message account.
 * Useful for displaying remaining credits in the business dashboard.
 */
export async function getBalance(): Promise<number | null> {
  try {
    const response = await fetch(`${API_BASE}/balance`, {
      headers: { 'Authorization': AUTH_HEADER },
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.balance ?? null
  } catch {
    return null
  }
}

// ── Delivery status ───────────────────────────────────────────────────────────

/**
 * Check delivery status of a sent message by its provider message ID.
 * Status values: 'delivered', 'failed', 'pending', 'sent'
 */
export async function getDeliveryStatus(
  messageId: string
): Promise<{ status: string; deliveredAt?: string } | null> {
  try {
    const response = await fetch(`${API_BASE}/messages/${messageId}`, {
      headers: { 'Authorization': AUTH_HEADER },
    })

    if (!response.ok) return null

    const data = await response.json()
    return {
      status: data.status ?? 'unknown',
      deliveredAt: data.delivered_at,
    }
  } catch {
    return null
  }
}
