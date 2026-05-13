// src/lib/twilio/client.ts
// Twilio SMS sending wrapper.

import twilio from 'twilio'

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  throw new Error('Missing Twilio environment variables')
}

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? ''

export type SmsResult = {
  success: boolean
  providerMsgId?: string
  error?: string
}

/** Send an SMS message. Returns success/failure — never throws. */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  try {
    const message = await twilioClient.messages.create({
      from: FROM_NUMBER,
      to,
      body,
    })
    return { success: true, providerMsgId: message.sid }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown Twilio error'
    console.error('[Twilio] SMS send failed:', error)
    return { success: false, error }
  }
}
