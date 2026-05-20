// src/app/api/admin/alert/route.ts
// POST /api/admin/alert — sends a health alert to all configured admin emails
// Called by the health check cron or manually from the admin dashboard

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { resend } from '@/lib/resend/client'
import { apiSuccess, apiError } from '@/lib/utils'
import type { HealthReport } from '@/app/api/health/route'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Appti'
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? 'https://appti.net'

function getAlertEmails(): string[] {
  const raw = process.env.ADMIN_ALERT_EMAILS ?? 'admin@appti.net'
  return raw.split(',').map(e => e.trim()).filter(Boolean)
}

function statusEmoji(s: string) {
  return s === 'ok' ? '✅' : s === 'warn' ? '⚠️' : '🔴'
}

function buildAlertHtml(report: HealthReport): string {
  const rows = Object.entries(report.services).map(([name, svc]) => `
    <tr>
      <td style="padding:10px 16px;font-size:14px;color:#1A1035;font-family:Arial,Helvetica,sans-serif;font-weight:600;text-transform:capitalize;">${name}</td>
      <td style="padding:10px 16px;font-size:14px;font-family:Arial,Helvetica,sans-serif;">
        <span style="background:${svc.status === 'ok' ? '#D1FAE5' : svc.status === 'warn' ? '#FEF3C7' : '#FEE2E2'};color:${svc.status === 'ok' ? '#065F46' : svc.status === 'warn' ? '#92400E' : '#991B1B'};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold;">
          ${statusEmoji(svc.status)} ${svc.status.toUpperCase()}
        </span>
      </td>
      <td style="padding:10px 16px;font-size:13px;color:#8B82B0;font-family:Arial,Helvetica,sans-serif;">
        ${'latencyMs' in svc && svc.latencyMs ? `${svc.latencyMs}ms` : ''}
        ${'minutesSince' in svc && svc.minutesSince !== undefined ? `Last seen ${svc.minutesSince}min ago` : ''}
        ${'failed' in svc && svc.failed !== undefined ? `${svc.failed} failed jobs` : ''}
        ${'error' in svc && svc.error ? `<span style="color:#DC2626;">${svc.error}</span>` : ''}
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#F5F3FB;font-family:Arial,Helvetica,sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#F5F3FB;padding:32px 16px;">
    <tr><td align="center">
      <table border="0" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background-color:#ffffff;border-radius:12px;border:1px solid #E2DCEF;">
        <tr>
          <td style="background-color:${report.status === 'error' ? '#DC2626' : '#F59E0B'};padding:20px 28px;border-radius:12px 12px 0 0;">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
              ${statusEmoji(report.status)} ${APP_NAME} System Alert
            </p>
            <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);font-family:Arial,Helvetica,sans-serif;">
              ${new Date(report.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })} AEST
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 16px;font-size:15px;color:#4A3F7A;font-family:Arial,Helvetica,sans-serif;">
              A system health check has detected an issue with one or more services.
            </p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #E2DCEF;border-radius:10px;overflow:hidden;">
              <thead>
                <tr style="background-color:#F5F3FB;">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#8B82B0;text-transform:uppercase;letter-spacing:0.05em;font-family:Arial,Helvetica,sans-serif;">Service</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#8B82B0;text-transform:uppercase;letter-spacing:0.05em;font-family:Arial,Helvetica,sans-serif;">Status</th>
                  <th style="padding:10px 16px;text-align:left;font-size:11px;color:#8B82B0;text-transform:uppercase;letter-spacing:0.05em;font-family:Arial,Helvetica,sans-serif;">Detail</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin-top:20px;text-align:center;">
              <a href="${APP_URL}/admin" style="display:inline-block;background-color:#E8845A;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 24px;border-radius:10px;font-family:Arial,Helvetica,sans-serif;">
                View Admin Dashboard
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background-color:#F5F3FB;padding:16px 28px;border-radius:0 0 12px 12px;border-top:1px solid #E2DCEF;">
            <p style="margin:0;font-size:12px;color:#8B82B0;font-family:Arial,Helvetica,sans-serif;">
              This is an automated alert from ${APP_NAME}. To update alert recipients, change ADMIN_ALERT_EMAILS in your environment variables.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  // Allow internal calls with secret token or from admin session
  const session = await getServerSession(authOptions)
  const body    = await req.json().catch(() => ({}))
  const token   = (body as any).token ?? req.headers.get('x-alert-token')
  const isAdmin  = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER'
  const hasToken = token === process.env.HEALTH_CHECK_TOKEN

  if (!isAdmin && !hasToken) return apiError('Unauthorised', 401)

  const report: HealthReport = (body as any).report
  if (!report) return apiError('Missing report', 400)

  const alertEmails = getAlertEmails()
  const subject     = `${report.status === 'error' ? '🔴 CRITICAL' : '⚠️ WARNING'} — ${APP_NAME} system issue detected`

  const textBody = [
    `${APP_NAME} System Alert`,
    `Time: ${new Date(report.timestamp).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })} AEST`,
    `Overall status: ${report.status.toUpperCase()}`,
    '',
    'Service details:',
    ...Object.entries(report.services).map(([name, svc]) =>
      `  ${name}: ${svc.status} ${'error' in svc && svc.error ? `— ${svc.error}` : ''} ${'minutesSince' in svc && svc.minutesSince ? `— last seen ${svc.minutesSince}min ago` : ''}`
    ),
    '',
    `View dashboard: ${APP_URL}/admin`,
  ].join('\n')

  const results = await Promise.allSettled(
    alertEmails.map(email =>
      resend.emails.send({
        from:    `${APP_NAME} Alerts <admin@appti.net>`,
        to:      email,
        subject,
        text:    textBody,
        html:    buildAlertHtml(report),
      })
    )
  )

  const sent    = results.filter(r => r.status === 'fulfilled').length
  const failed  = results.filter(r => r.status === 'rejected').length

  console.log(`[admin/alert] Sent ${sent}/${alertEmails.length} alert emails`)

  return apiSuccess({ sent, failed, recipients: alertEmails })
}
