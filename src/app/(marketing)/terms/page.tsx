// src/app/(marketing)/terms/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service — Appti' }

const LAST_UPDATED = '17 May 2026'
const APP_NAME     = 'Appti'
const CONTACT      = 'contact@appti.net'

export default function TermsPage() {
  const h2Style: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#1A1035', marginTop: 40, marginBottom: 12 }
  const pStyle:  React.CSSProperties = { fontSize: 15, color: '#4A3F7A', lineHeight: 1.8, marginBottom: 12 }
  const liStyle: React.CSSProperties = { fontSize: 15, color: '#4A3F7A', lineHeight: 1.8, marginBottom: 6 }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1A1035', letterSpacing: '-0.02em', marginBottom: 8 }}>Terms of Service</h1>
      <p style={{ fontSize: 14, color: '#8B82B0', marginBottom: 48 }}>Last updated: {LAST_UPDATED}</p>

      <p style={pStyle}>
        These Terms of Service govern your use of {APP_NAME} (&ldquo;the Service&rdquo;). By registering an account, you agree to these terms.
        If you do not agree, do not use the Service.
      </p>

      <h2 style={h2Style}>1. The service</h2>
      <p style={pStyle}>
        {APP_NAME} provides online appointment booking software for service businesses. Features include a client-facing booking page,
        automated SMS and email reminders, calendar integration, and a management dashboard.
        The Service is provided on a pay-as-you-go and subscription basis.
      </p>

      <h2 style={h2Style}>2. Account registration</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {[
          'You must be 18 or over to register',
          'You are responsible for maintaining the security of your account credentials',
          'You must provide accurate information and keep it up to date',
          'Each account may only be used by one business entity',
          'You are responsible for all activity under your account',
        ].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>

      <h2 style={h2Style}>3. Acceptable use</h2>
      <p style={pStyle}>You agree not to use the Service to:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {[
          'Send unsolicited commercial messages (spam)',
          'Collect client data without their consent',
          'Violate any applicable laws or regulations',
          'Send messages that are misleading, harassing, or harmful',
          'Attempt to reverse-engineer, copy, or resell the Service',
          'Use the Service for any purpose other than appointment booking',
        ].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>
      <p style={pStyle}>
        You are responsible for ensuring your clients have consented to receive SMS and email reminders.
        You must comply with the Spam Act 2003 (Australia) and the Australian Privacy Act 1988.
      </p>

      <h2 style={h2Style}>4. ACMA and sender ID compliance</h2>
      <p style={pStyle}>
        From July 2026, the Australian Communications and Media Authority (ACMA) requires all businesses sending commercial SMS
        to register their sender ID. You are responsible for registering your sender ID through your SMS provider before sending
        commercial messages. {APP_NAME} is not liable for messages blocked due to unregistered sender IDs.
      </p>

      <h2 style={h2Style}>5. Credits and payments</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {[
          'Credits are pre-purchased and deducted when messages are sent',
          'Credits do not expire and are non-refundable once messages have been sent',
          'Subscription fees are charged monthly and are non-refundable',
          'Plan upgrades are charged on a prorated basis',
          'Downgrades take effect at the end of the current billing cycle',
          'All prices are in Australian dollars (AUD) and include GST where applicable',
        ].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>

      <h2 style={h2Style}>6. Service availability</h2>
      <p style={pStyle}>
        We aim for high availability but do not guarantee uninterrupted access. Scheduled maintenance will be notified in advance
        where possible. We are not liable for losses resulting from service interruptions.
      </p>

      <h2 style={h2Style}>7. Data and privacy</h2>
      <p style={pStyle}>
        Your use of the Service is subject to our{' '}
        <a href="/privacy" style={{ color: '#E8845A' }}>Privacy Policy</a>.
        You retain ownership of your business and client data. You grant us a limited licence to process that data
        solely to provide the Service.
      </p>

      <h2 style={h2Style}>8. Intellectual property</h2>
      <p style={pStyle}>
        {APP_NAME} and all associated software, design, and content are owned by us and protected by copyright and other intellectual property laws.
        You may not copy, modify, or redistribute any part of the Service without our written permission.
      </p>

      <h2 style={h2Style}>9. Limitation of liability</h2>
      <p style={pStyle}>
        To the maximum extent permitted by Australian law, {APP_NAME} is not liable for indirect, incidental, or consequential damages
        including lost revenue, missed appointments, or data loss. Our total liability to you for any claim is limited to the amount you
        paid us in the 3 months prior to the claim.
      </p>
      <p style={pStyle}>
        Nothing in these terms limits liability for fraud, death or personal injury caused by negligence,
        or any other liability that cannot be excluded by law.
      </p>

      <h2 style={h2Style}>10. Termination</h2>
      <p style={pStyle}>
        You may cancel your account at any time from the billing settings. We may suspend or terminate accounts that violate these terms,
        with notice where reasonably practicable. On termination, your data is retained for 30 days then deleted, except where required by law.
      </p>

      <h2 style={h2Style}>11. Changes to terms</h2>
      <p style={pStyle}>
        We may update these terms from time to time. We will notify you by email at least 14 days before material changes take effect.
        Continued use after the effective date constitutes acceptance.
      </p>

      <h2 style={h2Style}>12. Governing law</h2>
      <p style={pStyle}>
        These terms are governed by the laws of Victoria, Australia. Disputes are subject to the exclusive jurisdiction of Victorian courts.
      </p>

      <h2 style={h2Style}>13. Contact</h2>
      <p style={pStyle}>
        Legal enquiries: <a href={`mailto:${CONTACT}`} style={{ color: '#E8845A' }}>{CONTACT}</a>
      </p>
    </div>
  )
}
