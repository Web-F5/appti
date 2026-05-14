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

function htmlWrap(content: string, businessName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F3FB;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FB;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2DCEF;">
        <!-- Header -->
        <tr><td style="background:#2D1B69;padding:24px 32px;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">${businessName}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#F5F3FB;padding:20px 32px;border-top:1px solid #E2DCEF;">
          <p style="margin:0;font-size:12px;color:#8B82B0;">
            This message was sent by ${businessName} via Appti booking.
            If you did not make this booking, please ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
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
  const feedUrl   = `${appUrl}/api/calendar/${businessSlug}/feed.ics`

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
    'Option 1 — Calendar file (works with all calendar apps):',
    'A calendar file (.ics) is attached to this email.',
    'Double-click it and choose "Add to Calendar" when prompted.',
    '',
    'Option 2 — Google Calendar:',
    gcalUrl,
    '',
    'Option 3 — Subscribe (auto-updates with future changes):',
    `Copy this link and subscribe in your calendar app: ${feedUrl}`,
    '  Apple Calendar: File → New Calendar Subscription',
    '  Outlook: Add calendar → From internet',
    '',
    `See you soon,`,
    businessName,
  ].filter(Boolean).join('\n')

  // ── HTML version ────────────────────────────────────────────────────────────
  const htmlContent = `
    <p style="margin:0 0 8px;font-size:16px;color:#1A1035;">Hi ${clientName},</p>
    <p style="margin:0 0 24px;font-size:16px;color:#4A3F7A;">Your booking is confirmed! Here are the details:</p>

    <!-- Booking details box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#EDE9FF;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        ${[
          ['Service',  serviceName],
          staffName ? ['With', staffName] : null,
          ['Date',     startsAt.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
          ['Time',     timeStr],
        ].filter(Boolean).map(([label, value]) => `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
            <tr>
              <td width="80" style="font-size:12px;font-weight:600;color:#8B82B0;text-transform:uppercase;letter-spacing:0.05em;">${label}</td>
              <td style="font-size:14px;font-weight:600;color:#1A1035;">${value}</td>
            </tr>
          </table>`).join('')}
      </td></tr>
    </table>

    <!-- Calendar options -->
    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A1035;">Add to your calendar</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding:12px 16px;background:#F5F3FB;border-radius:10px;font-size:13px;color:#4A3F7A;">
          <p style="margin:0 0 4px;font-weight:600;color:#1A1035;">📎 Calendar file attached</p>
          <p style="margin:0;color:#8B82B0;">An <strong>appointment.ics</strong> file is attached to this email.
          Double-click it and select <strong>"Add to Calendar"</strong> when prompted.
          Works with Apple Calendar, Outlook, Google Calendar, and most other apps.</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding:12px 16px;background:#F5F3FB;border-radius:10px;font-size:13px;color:#4A3F7A;">
          <p style="margin:0 0 8px;font-weight:600;color:#1A1035;">📅 Add directly to Google Calendar</p>
          <a href="${gcalUrl}" style="display:inline-block;background:#E8845A;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px;">
            Open in Google Calendar →
          </a>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#F5F3FB;border-radius:10px;font-size:13px;color:#4A3F7A;">
          <p style="margin:0 0 4px;font-weight:600;color:#1A1035;">🔄 Subscribe for auto-updates</p>
          <p style="margin:0 0 6px;color:#8B82B0;">Copy this link to subscribe in your calendar app — appointments stay in sync automatically:</p>
          <p style="margin:0 0 6px;font-family:monospace;font-size:12px;background:#EDE9FF;padding:6px 10px;border-radius:6px;word-break:break-all;color:#2D1B69;">${feedUrl}</p>
          <p style="margin:0;color:#8B82B0;font-size:12px;">
            <strong>Apple Calendar:</strong> File → New Calendar Subscription<br>
            <strong>Outlook:</strong> Add calendar → From internet<br>
            <strong>Thunderbird:</strong> New Calendar → On the network
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#4A3F7A;">See you soon,<br><strong>${businessName}</strong></p>
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
