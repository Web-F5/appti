# Appointment System

Pay-as-you-go appointment booking with SMS/email reminders and calendar sync.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 15 (App Router, TypeScript) |
| Database | PostgreSQL via Prisma ORM |
| Job queue | BullMQ + Redis (Upstash) |
| SMS | Mobile Message (Australian, direct carrier) |
| Email | Resend |
| Payments | Stripe (subscriptions + metered) |
| Calendar | iCal feed / CalDAV |
| Deployment | Vercel (app) + Railway (worker) |

---

## Getting started

### 1. Clone and install

```bash
git clone <your-repo>
cd appt-system
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 3. Set up the database

```bash
npm run db:migrate    # runs Prisma migrations
npm run db:generate   # generates Prisma client
npm run db:seed       # creates demo business + services
```

### 4. Start development

```bash
# Terminal 1 — Next.js app
npm run dev

# Terminal 2 — BullMQ reminder worker
npm run worker:dev
```

App: http://localhost:3000  
Demo booking page: http://localhost:3000/book/demo-trades  
Prisma Studio: `npm run db:studio`

---

## Project structure

```
appt-system/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Demo data seed
│
├── workers/
│   └── reminder.worker.ts    # BullMQ worker (runs as separate process)
│
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, register, forgot password
│   │   ├── (booking)/        # Public booking flow (/book/[businessSlug])
│   │   ├── (dashboard)/      # Authenticated business dashboard
│   │   └── api/
│   │       ├── appointments/ # CRUD + booking creation
│   │       ├── availability/ # Slot calculation
│   │       ├── businesses/   # Business management
│   │       ├── clients/      # Client management
│   │       ├── reminders/    # Reminder template management
│   │       ├── services/     # Service management
│   │       ├── staff/        # Staff + availability management
│   │       └── webhooks/
│   │           ├── stripe/   # Subscription + payment events
│   │           └── calendar/ # Calendar sync callbacks
│   │
│   ├── lib/
│   │   ├── prisma/           # Prisma singleton client
│   │   ├── stripe/           # Stripe client + billing helpers
│   │   ├── twilio/           # SMS sending
│   │   ├── resend/           # Email sending + confirmation
│   │   ├── bullmq/           # Job queue definitions + helpers
│   │   ├── caldav/           # iCal generation
│   │   └── utils/            # Shared utilities (cn, formatInTz, renderTemplate)
│   │
│   ├── components/
│   │   ├── ui/               # Reusable UI primitives (button, input, etc.)
│   │   ├── booking/          # Booking flow components (service picker, time picker)
│   │   ├── dashboard/        # Dashboard components (appointment list, stats)
│   │   ├── reminders/        # Reminder template editor
│   │   └── calendar/         # Calendar display components
│   │
│   ├── types/
│   │   └── index.ts          # App-layer types, PLAN_CONFIG, ReminderTemplateVars
│   │
│   ├── hooks/                # Custom React hooks
│   └── middleware.ts         # Route protection
```

---

## Key concepts

### Booking flow (client-facing)
`/book/[businessSlug]` → pick service → pick staff (optional) → pick date/time → enter details → confirmed

### Reminder pipeline
1. Appointment created → reminder jobs scheduled in BullMQ with `delay`
2. Worker fires at scheduled time → sends SMS (Twilio) or email (Resend)
3. Usage event logged → credit balance debited → Stripe notified

### Pay-as-you-go billing
- PAYG: top up credit balance, deducted per message
- STARTER ($29/mo): 150 SMS + 500 email included, cheaper overage
- PRO ($79/mo): 500 SMS + 2000 email included, lowest overage

### Calendar sync
- **iCal feed**: `/api/calendar/[slug]/feed.ics` — subscribe in any calendar app
- **CalDAV**: two-way sync for Apple Calendar + Thunderbird (coming in phase 2)
- **Google / Outlook API**: OAuth-based real-time sync (coming in phase 2)

---

## Next functions to implement (drop into existing stubs)

| File | Function |
|---|---|
| `src/app/api/availability/route.ts` | Slot calculation engine |
| `src/app/api/appointments/route.ts` | Full appointment creation (POST) |
| `src/app/api/appointments/[id]/route.ts` | Cancel / reschedule logic |
| `src/lib/bullmq/queues.ts` | Already done |
| `src/lib/caldav/ical.ts` | Already done |
| `src/components/booking/` | BookingWizard, ServicePicker, TimePicker, ClientForm |
| `src/app/(dashboard)/dashboard/page.tsx` | Real data queries |

---

## Deployment

### App (Vercel)
```bash
vercel deploy
# Set all .env.example variables in Vercel dashboard
```

### Worker (Railway or Fly.io)
The worker is a long-running Node process — it cannot run on Vercel (serverless).

```bash
# Railway: point start command to:
npm run worker:start
```

### Stripe webhook
```bash
# Development — forward to local:
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Production — add endpoint in Stripe dashboard:
# https://yourdomain.com/api/webhooks/stripe
# Events: customer.subscription.*, checkout.session.completed
```
