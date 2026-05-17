// src/app/(marketing)/help/page.tsx
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Help & FAQ — Appti',
  description: 'Answers to common questions about Appti booking software.',
}

const SECTIONS = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'How do I set up my booking page?',
        a: `After registering, go to Settings → Business profile to add your business name and brand colour. Then go to Settings → Services to add the services you offer, and Settings → Staff to add yourself and any team members. Your booking page is immediately live at appti.net/book/your-business-name.`,
      },
      {
        q: 'How do clients find my booking page?',
        a: `Share the link to your booking page anywhere — your website, email signature, social media, or a QR code. The link is shown in Settings → Business profile. You can also embed a booking button on your website.`,
      },
      {
        q: 'Can I try it before paying anything?',
        a: `Yes. The Pay As You Go plan is free — you only pay when SMS or email reminders are actually sent. You can take unlimited bookings with no monthly cost. Add credits to your account when you're ready to start sending reminders.`,
      },
    ],
  },
  {
    title: 'Bookings & appointments',
    items: [
      {
        q: 'How do clients book an appointment?',
        a: `Clients visit your booking page, choose a service, pick a date and time, enter their details, and confirm. They immediately receive a confirmation email with a calendar invite attached.`,
      },
      {
        q: 'Can I require approval before confirming bookings?',
        a: `Yes. In Settings → Booking rules, turn on "Require manual confirmation". New bookings will show as Pending in your dashboard until you confirm them. The client receives a confirmation email only after you approve.`,
      },
      {
        q: 'Can clients cancel their own bookings?',
        a: `You can allow or disallow client cancellations in Settings → Booking rules. If enabled, clients can cancel via a link in their confirmation email, up to a set number of hours before the appointment.`,
      },
      {
        q: 'How do I add a booking to my calendar?',
        a: `Every confirmed booking sends the client (and you, via the dashboard iCal feed) a calendar invite. As the business owner, go to Settings → Business profile to find your personal calendar subscription link — add it to Apple Calendar, Outlook, or Thunderbird for automatic syncing.`,
      },
    ],
  },
  {
    title: 'Reminders & messaging',
    items: [
      {
        q: 'How do automated reminders work?',
        a: `Go to Settings → Reminders to configure your reminder templates. You can add multiple reminders — for example, an email 24 hours before and an SMS 1 hour before. Reminders fire automatically for every confirmed appointment.`,
      },
      {
        q: 'How long can an SMS message be?',
        a: `Standard SMS messages are 160 characters maximum per segment. Messages longer than 160 characters are sent as multiple segments and count as multiple messages for billing purposes. The reminder editor shows a character count to help you stay within one segment.`,
      },
      {
        q: 'What are the template variables I can use?',
        a: `In your reminder message, you can use: {{client_name}}, {{business_name}}, {{service_name}}, {{staff_name}}, {{time}}, {{date}}, and {{cancel_url}}. These are replaced with the actual booking details when the reminder is sent.`,
      },
      {
        q: 'What happens if my credit balance runs out?',
        a: `Reminders will not be sent if your credit balance is insufficient. You'll see a warning on your dashboard and billing page when the balance is low. Top up your credits at any time from the Billing page.`,
      },
    ],
  },
  {
    title: 'Billing & credits',
    items: [
      {
        q: 'How does credit-based billing work?',
        a: `Credits are pre-purchased and deducted as messages are sent. On the Pay As You Go plan, every message costs credits. On Starter and Pro plans, your included monthly bundle is used first — credits are only deducted once the bundle is exhausted. Credits never expire.`,
      },
      {
        q: 'What are the message rates?',
        a: `Pay As You Go: SMS $${process.env.NEXT_PUBLIC_RATE_SMS_PAYG ?? '0.120'}/message, Email $${process.env.NEXT_PUBLIC_RATE_EMAIL_PAYG ?? '0.0050'}/message. Starter ($29/month): ${process.env.BUNDLE_SMS_STARTER ?? '150'} SMS and ${process.env.BUNDLE_EMAIL_STARTER ?? '500'} emails included, then $${process.env.NEXT_PUBLIC_RATE_SMS_STARTER ?? '0.080'}/SMS and $${process.env.NEXT_PUBLIC_RATE_EMAIL_STARTER ?? '0.0030'}/email. Pro ($79/month): ${process.env.BUNDLE_SMS_PRO ?? '500'} SMS and ${process.env.BUNDLE_EMAIL_PRO ?? '2,000'} emails included, then $${process.env.NEXT_PUBLIC_RATE_SMS_PRO ?? '0.060'}/SMS and $${process.env.NEXT_PUBLIC_RATE_EMAIL_PRO ?? '0.0020'}/email.`,
      },
      {
        q: 'Can I upgrade or downgrade my plan?',
        a: `Yes, at any time. When upgrading, you're charged the prorated difference for the remaining days in your billing cycle. When downgrading, the unused portion of your current plan is credited to future invoices. Changes take effect immediately.`,
      },
      {
        q: 'Are payments secure?',
        a: `All payments are processed by Stripe, a certified PCI-DSS Level 1 payment provider. Appti never stores your card details. Payments are secured with industry-standard encryption.`,
      },
    ],
  },
  {
    title: 'Technical',
    items: [
      {
        q: 'Does my booking page work on mobile?',
        a: `Yes. The booking page is fully responsive and designed to work on any device — phone, tablet, or desktop.`,
      },
      {
        q: 'Can I add the booking form to my existing website?',
        a: `Yes — link to your Appti booking page from your website, or use a "Book now" button that opens it. An embeddable widget for dropping directly into your site is coming soon.`,
      },
      {
        q: 'Is my data secure and private?',
        a: `Client booking data is stored securely in encrypted databases hosted in Australia (Sydney region). We do not sell or share client data with third parties. See our Privacy Policy for full details.`,
      },
    ],
  },
]

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px' }}>
      <div style={{ marginBottom: 56, textAlign: 'center' }}>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#1A1035', letterSpacing: '-0.02em', marginBottom: 12 }}>
          Help & FAQ
        </h1>
        <p style={{ fontSize: 17, color: '#8B82B0', marginBottom: 20 }}>
          Can't find what you're looking for?{' '}
          <Link href="/contact" style={{ color: '#E8845A', textDecoration: 'none', fontWeight: 600 }}>Contact us</Link>
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {SECTIONS.map(section => (
          <div key={section.title}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#2D1B69', marginBottom: 20, paddingBottom: 12, borderBottom: '0.5px solid #E2DCEF' }}>
              {section.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {section.items.map((item, i) => (
                <details key={i} style={{ borderBottom: '0.5px solid #E2DCEF', padding: '16px 0' }}>
                  <summary style={{ fontSize: 15, fontWeight: 600, color: '#1A1035', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {item.q}
                    <span style={{ color: '#E8845A', fontSize: 20, fontWeight: 300, flexShrink: 0, marginLeft: 12 }}>+</span>
                  </summary>
                  <p style={{ marginTop: 12, marginBottom: 0, fontSize: 14, color: '#4A3F7A', lineHeight: 1.7 }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 64, textAlign: 'center', background: '#EDE9FF', borderRadius: 16, padding: '40px 32px' }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1035', marginBottom: 8 }}>Still need help?</h3>
        <p style={{ fontSize: 15, color: '#8B82B0', marginBottom: 20 }}>Our support team is here to help.</p>
        <Link href="/contact" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, background: '#E8845A', color: 'white', textDecoration: 'none' }}>
          Contact support
        </Link>
      </div>
    </div>
  )
}
