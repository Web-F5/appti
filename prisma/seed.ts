// prisma/seed.ts
// Run with: npm run db:seed

import { PrismaClient, DayOfWeek, ReminderChannel } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const business = await prisma.business.upsert({
    where: { slug: 'demo-trades' },
    update: {},
    create: {
      name: 'Demo Service Co.',
      slug: 'demo-service-business',
      timezone: 'Australia/Melbourne',
      primaryColor: '#2563eb',
      bookingLeadHours: 2,
      bookingMaxDays: 60,
      requiresConfirm: false,
      allowClientCancel: true,
      cancelLeadHours: 24,

      // Default reminder templates
      reminderTemplates: {
        create: [
          {
            channel: ReminderChannel.EMAIL,
            offsetMins: 1440, // 24 hours
            subject: 'Reminder: Your appointment tomorrow with {{business_name}}',
            bodyTemplate:
              'Hi {{client_name}},\n\nThis is a reminder that you have an appointment for {{service_name}} tomorrow at {{time}}.\n\nLocation: {{location}}\n\nNeed to cancel? {{cancel_url}}\n\nSee you soon,\n{{business_name}}',
            isActive: true,
          },
          {
            channel: ReminderChannel.SMS,
            offsetMins: 60, // 1 hour
            bodyTemplate:
              'Reminder: {{service_name}} with {{business_name}} in 1 hour at {{time}}. Cancel: {{cancel_url}}',
            isActive: true,
          },
        ],
      },
    },
  })

  console.log(`Business created: ${business.name} (slug: ${business.slug})`)

  // Staff member
  const staff = await prisma.staffMember.upsert({
    where: { businessId_email: { businessId: business.id, email: 'staff@demo.com' } },
    update: {},
    create: {
      businessId: business.id,
      name: 'Alex Demo',
      email: 'staff@demo.com',
      phone: '+61400000000',
      isActive: true,

      availabilityRules: {
        create: [
          { dayOfWeek: DayOfWeek.MONDAY,    startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: DayOfWeek.TUESDAY,   startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: DayOfWeek.THURSDAY,  startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: DayOfWeek.FRIDAY,    startTime: '09:00', endTime: '15:00' },
        ],
      },
    },
  })

  console.log(`Staff created: ${staff.name}`)

  // Services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567891' },
      update: {},
      create: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567891',
        businessId: business.id,
        name: 'Standard Inspection',
        description: 'Full property inspection — electrical, plumbing, and safety check.',
        durationMins: 60,
        price: 180.00,
        color: '#3b82f6',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567892' },
      update: {},
      create: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567892',
        businessId: business.id,
        name: 'Quick Quote Visit',
        description: 'On-site visit to assess work and provide a quote.',
        durationMins: 30,
        price: null,  // quote-based
        color: '#10b981',
        isActive: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567893' },
      update: {},
      create: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567893',
        businessId: business.id,
        name: 'Emergency Call-Out',
        description: 'Priority same-day or next-day emergency service.',
        durationMins: 90,
        price: 320.00,
        color: '#ef4444',
        isActive: true,
      },
    }),
  ])

  console.log(`Services created: ${services.map(s => s.name).join(', ')}`)

  // Link staff to all services
  await Promise.all(
    services.map(service =>
      prisma.staffService.upsert({
        where: { staffMemberId_serviceId: { staffMemberId: staff.id, serviceId: service.id } },
        update: {},
        create: { staffMemberId: staff.id, serviceId: service.id },
      })
    )
  )

  console.log('Staff linked to all services')

  // Dev user account — login: admin@demo.com / password: password123
  const hashedPassword = await bcrypt.hash('password123', 12)

  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name:           'Demo Admin',
      email:          'admin@demo.com',
      hashedPassword,
      businessId:     business.id,
      role:           'OWNER',
    },
  })

  console.log('Dev user created: admin@demo.com / password123')
  console.log('\nSeed complete.')
  console.log(`\nBooking page: http://localhost:3000/book/${business.slug}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
