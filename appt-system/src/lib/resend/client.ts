// src/lib/resend/client.ts
// Resend email sending wrapper.

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = `${process.env.RESEND_FROM_NAME ?? 'Booking System'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@example.com'}>`

export type EmailResult = {
  success: boolean
  providerMsgId?: string
  error?: string
}

/** Send a plain-text reminder email. Returns success/failure — never throws. */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      text: body,
    })

    if (error) {
      console.error('[Resend] Email send failed:', error)
      return { success: false, error: error.message }
    }

    return { success: true, providerMsgId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown Resend error'
    console.error('[Resend] Email send failed:', error)
    return { success: false, error }
  }
}

/** Send a booking confirmation email with an iCal attachment */
export async function sendConfirmationEmail(params: {
  to: string
  clientName: string
  businessName: string
  serviceName: string
  startsAt: Date
  icsContent: string
}): Promise<EmailResult> {
  const { to, clientName, businessName, serviceName, startsAt, icsContent } = params

  const dateStr = startsAt.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  try {
    console.log('[Resend] Sending confirmation to:', to, '| From:', FROM)
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Booking confirmed — ${serviceName} with ${businessName}`,
      text: `Hi ${clientName},\n\nYour booking is confirmed!\n\nService: ${serviceName}\nWith: ${businessName}\nWhen: ${dateStr}\n\nA calendar invite is attached.\n\n${businessName}`,
      attachments: [
        {
          filename: 'appointment.ics',
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    })

    console.log('[Resend] Result — data:', data, '| error:', error)
    if (error) return { success: false, error: error.message }
    return { success: true, providerMsgId: data?.id }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Resend] Confirmation email exception:', error)
    return { success: false, error }
  }
}
