// src/app/(marketing)/privacy/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Appti',
}

const LAST_UPDATED = '17 May 2026'
const APP_NAME     = 'Appti'
const CONTACT      = 'contact@appti.net'

export default function PrivacyPage() {
  const h2Style: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#1A1035', marginTop: 40, marginBottom: 12 }
  const pStyle:  React.CSSProperties = { fontSize: 15, color: '#4A3F7A', lineHeight: 1.8, marginBottom: 12 }
  const liStyle: React.CSSProperties = { fontSize: 15, color: '#4A3F7A', lineHeight: 1.8, marginBottom: 6 }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>
      <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1A1035', letterSpacing: '-0.02em', marginBottom: 8 }}>Privacy Policy</h1>
      <p style={{ fontSize: 14, color: '#8B82B0', marginBottom: 48 }}>Last updated: {LAST_UPDATED}</p>

      <p style={pStyle}>
        {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy.
        This policy explains what information we collect, how we use it, and your rights in relation to it.
        By using {APP_NAME}, you agree to the practices described in this policy.
      </p>

      <h2 style={h2Style}>1. Who we are</h2>
      <p style={pStyle}>
        {APP_NAME} is an online appointment booking platform for service businesses, operated in Australia.
        We are subject to the Australian Privacy Act 1988 and the Australian Privacy Principles (APPs).
        Questions about this policy can be directed to <a href={`mailto:${CONTACT}`} style={{ color: '#E8845A' }}>{CONTACT}</a>.
      </p>

      <h2 style={h2Style}>2. Information we collect</h2>
      <p style={pStyle}>We collect two categories of information:</p>
      <p style={{ ...pStyle, fontWeight: 600 }}>Business account holders (our customers):</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {['Name and email address (registration)', 'Business name, website, and contact details', 'Payment information (processed by Stripe — we do not store card numbers)', 'Usage data (messages sent, appointments managed)'].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>
      <p style={{ ...pStyle, fontWeight: 600 }}>End clients (people who make bookings):</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {['Name, email address, and phone number (provided at booking)', 'Appointment details (service, date, time, notes)', 'Calendar data (stored only to generate calendar invites)'].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>

      <h2 style={h2Style}>3. How we use your information</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {[
          'To provide the booking and reminder service',
          'To send appointment confirmation and reminder messages (SMS and email)',
          'To process payments for credits and subscriptions',
          'To provide customer support',
          'To improve our service and fix technical issues',
          'To comply with legal obligations',
        ].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>
      <p style={pStyle}>We do not sell your data or use it for advertising purposes.</p>

      <h2 style={h2Style}>4. Data storage and security</h2>
      <p style={pStyle}>
        Data is stored in encrypted databases hosted in the Asia-Pacific region (Sydney, Australia) via Neon (PostgreSQL).
        We use industry-standard encryption for data in transit (TLS) and at rest.
        Access to production systems is restricted to authorised personnel only.
      </p>

      <h2 style={h2Style}>5. Third-party services</h2>
      <p style={pStyle}>We use the following trusted third parties to deliver our service:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {[
          'Stripe — payment processing (subject to Stripe\'s privacy policy)',
          'Resend — transactional email delivery',
          'Mobile Message — SMS delivery (Australian carrier)',
          'Vercel — application hosting',
          'Upstash — job queue infrastructure (Sydney region)',
        ].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>
      <p style={pStyle}>These providers process data only as necessary to deliver their services and are bound by appropriate data processing agreements.</p>

      <h2 style={h2Style}>6. End client data and business responsibility</h2>
      <p style={pStyle}>
        Business account holders are responsible for obtaining appropriate consent from their clients before collecting and using their personal information through {APP_NAME}.
        {APP_NAME} acts as a data processor on behalf of business account holders for end client data.
        Business account holders must comply with the Australian Privacy Act and any other applicable privacy laws in their dealings with their clients.
      </p>

      <h2 style={h2Style}>7. Data retention</h2>
      <p style={pStyle}>
        We retain account data for as long as your account is active, plus a reasonable period for legal and business purposes after closure.
        Appointment data is retained for 3 years from the date of the appointment.
        You may request deletion of your data at any time — see section 9.
      </p>

      <h2 style={h2Style}>8. Cookies</h2>
      <p style={pStyle}>
        We use session cookies to maintain your login state. We do not use advertising or tracking cookies.
        No third-party analytics cookies are placed on our site.
      </p>

      <h2 style={h2Style}>9. Your rights</h2>
      <p style={pStyle}>Under Australian privacy law, you have the right to:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
        {[
          'Access the personal information we hold about you',
          'Correct inaccurate information',
          'Request deletion of your data (subject to legal retention requirements)',
          'Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)',
        ].map((item, i) => <li key={i} style={liStyle}>{item}</li>)}
      </ul>
      <p style={pStyle}>To exercise these rights, contact us at <a href={`mailto:${CONTACT}`} style={{ color: '#E8845A' }}>{CONTACT}</a>. We will respond within 30 days.</p>

      <h2 style={h2Style}>10. Changes to this policy</h2>
      <p style={pStyle}>
        We may update this policy from time to time. We will notify account holders of material changes by email.
        Continued use of {APP_NAME} after changes constitutes acceptance of the updated policy.
      </p>

      <h2 style={h2Style}>11. Contact</h2>
      <p style={pStyle}>
        Privacy enquiries: <a href={`mailto:${CONTACT}`} style={{ color: '#E8845A' }}>{CONTACT}</a>
      </p>
    </div>
  )
}
