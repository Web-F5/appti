// src/lib/resend/client.ts
// Resend email sending wrapper.
// All emails send both HTML and plain text — clients see whichever their app supports.

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

// ── HTML email wrapper ────────────────────────────────────────────────────────
// Inline styles only — external CSS is blocked by most email clients.
// Uses table-based layout for maximum compatibility across all email clients.

function htmlWrap(content: string, businessName: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Message from ${businessName}</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F3FB;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F5F3FB;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #E2DCEF;">
          <tr>
            <td style="background-color:#2D1B69;padding:24px 32px;border-radius:12px 12px 0 0;">
              <p style="margin:0;font-size:20px;font-weight:bold;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">${businessName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#F5F3FB;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #E2DCEF;">
              <p style="margin:0;font-size:12px;color:#8B82B0;font-family:Arial,Helvetica,sans-serif;">
                This message was sent by ${businessName} via Appti booking.
                If you did not make this booking, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Google Calendar link builder ──────────────────────────────────────────────

function googleCalendarUrl(params: {
  title:    string
  start:    Date
  end:      Date
  details?: string
  location?: string
}): string {
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const p   = new URLSearchParams({
    action:   'TEMPLATE',
    text:     params.title,
    dates:    `${fmt(params.start)}/${fmt(params.end)}`,
    details:  params.details ?? '',
    location: params.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

// ── Confirmation email ────────────────────────────────────────────────────────

export async function sendConfirmationEmail(params: {
  to:           string
  clientName:   string
  businessName: string
  serviceName:  string
  staffName?:   string
  startsAt:     Date
  endsAt?:      Date
  icsContent:   string
  businessSlug: string
}): Promise<EmailResult> {
  const { to, clientName, businessName, serviceName, staffName, startsAt, endsAt, icsContent, businessSlug } = params

  const appUrl    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://appti.net'
  const dateStr   = startsAt.toLocaleDateString('en-AU', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const timeStr   = startsAt.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
  const endDate   = endsAt ?? new Date(startsAt.getTime() + 60 * 60 * 1000)
  const gcalUrl   = googleCalendarUrl({
    title:   `${serviceName} with ${businessName}`,
    start:   startsAt,
    end:     endDate,
    details: `Booked via ${businessName}`,
  })

  // ── Plain text version ──────────────────────────────────────────────────────
  const text = [
    `Hi ${clientName},`,
    '',
    `Your booking is confirmed!`,
    '',
    `Service:  ${serviceName}`,
    `Business: ${businessName}`,
    staffName ? `With:     ${staffName}` : '',
    `When:     ${dateStr}`,
    '',
    '── ADDING TO YOUR CALENDAR ──',
    '',
    'Option 1 — Calendar file (.ics) attached:',
    'A calendar invite (.ics file) is attached to this email.',
    'Click or double-click it to open it — your calendar app will ask you to add the appointment.',
    'Works with Apple Calendar, Outlook, Google Calendar, and most calendar apps.',
    '',
    'Option 2 — Add directly to Google Calendar:',
    gcalUrl,
    '',
    `See you soon,`,
    businessName,
  ].filter(Boolean).join('\n')

  // ── HTML version ────────────────────────────────────────────────────────────
  const htmlContent = `
    <p style="margin:0 0 8px 0;font-size:16px;color:#1A1035;font-family:Arial,Helvetica,sans-serif;">Hi ${clientName},</p>
    <p style="margin:0 0 24px 0;font-size:16px;color:#4A3F7A;font-family:Arial,Helvetica,sans-serif;">Your booking is confirmed! Here are the details:</p>

    <!-- Booking details box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#EDE9FF;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        ${([ 
          ['Service',  serviceName],
          staffName ? ['With', staffName] : null,
          ['Date',     startsAt.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
          ['Time',     timeStr],
        ].filter((row): row is string[] => row !== null)).map(([label, value]) => `
          <table border="0" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td width="80" style="font-size:12px;font-weight:bold;color:#8B82B0;text-transform:uppercase;letter-spacing:0.05em;font-family:Arial,Helvetica,sans-serif;">${label}</td>
              <td style="font-size:14px;font-weight:bold;color:#1A1035;font-family:Arial,Helvetica,sans-serif;">${value}</td>
            </tr>
          </table>`).join('')}
      </td></tr>
    </table>

    <!-- Calendar options -->
    <p style="margin:0 0 12px 0;font-size:14px;font-weight:bold;color:#1A1035;font-family:Arial,Helvetica,sans-serif;">Add to your calendar</p>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
      <tr>
        <td style="padding:14px 16px;background-color:#F5F3FB;border-radius:10px;font-size:13px;color:#4A3F7A;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 6px 0;font-weight:bold;color:#1A1035;font-family:Arial,Helvetica,sans-serif;">Calendar invite attached (.ics file)</p>
          <p style="margin:0;color:#555555;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
            A calendar invite file (<strong>appointment.ics</strong>) is attached to this email.
            Click or double-click it to open it &mdash; your calendar app will prompt you to add the appointment.
            This works with Apple Calendar, Outlook, Google Calendar, and most other calendar apps.
            You can also use the <strong>Open in Google Calendar</strong> button below as an alternative.
          </p>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
      <tr>
        <td style="padding:14px 16px;background-color:#F5F3FB;border-radius:10px;font-size:13px;color:#4A3F7A;font-family:Arial,Helvetica,sans-serif;">
          <p style="margin:0 0 10px 0;font-weight:bold;color:#1A1035;font-family:Arial,Helvetica,sans-serif;">Add directly to Google Calendar</p>
          <a href="${gcalUrl}" style="display:inline-block;background-color:#E8845A;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:10px 18px;border-radius:8px;font-family:Arial,Helvetica,sans-serif;">
            Open in Google Calendar
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#4A3F7A;font-family:Arial,Helvetica,sans-serif;">See you soon,<br /><strong>${businessName}</strong></p>
  `

  try {
    console.log('[Resend] Sending confirmation to:', to)
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to,
      subject: `Booking confirmed — ${serviceName} with ${businessName}`,
      text,
      html:    htmlWrap(htmlContent, businessName),
      attachments: [{
        filename: 'appointment.ics',
        content:  Buffer.from(icsContent).toString('base64'),
      }],
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

// ── Reminder email (HTML + text) ──────────────────────────────────────────────

export async function sendEmail(
  to:      string,
  subject: string,
  body:    string,
  html?:   string
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM, to, subject,
      text: body,
      html: html ?? htmlWrap(`<p style="white-space:pre-line;font-size:14px;color:#4A3F7A;line-height:1.7;">${body}</p>`, subject),
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
