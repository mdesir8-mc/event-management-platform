import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash('Password1', 10)

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@demo.com' },
    update: {},
    create: {
      email: 'organizer@demo.com',
      password_hash: passwordHash,
      full_name: 'Demo Organizer',
      role: 'organizer',
      organization_name: 'Demo Events Inc',
    },
  })

  const sponsor = await prisma.user.upsert({
    where: { email: 'sponsor@demo.com' },
    update: {},
    create: {
      email: 'sponsor@demo.com',
      password_hash: passwordHash,
      full_name: 'Demo Sponsor',
      role: 'sponsor',
      organization_name: 'Acme Corp',
    },
  })

  const events = [
    {
      title: 'TechConf 2027',
      slug: 'techconf-2027',
      description: 'The biggest tech conference of the year.',
      event_type: 'conference' as const,
      status: 'published' as const,
      start_date: new Date('2027-03-15T09:00:00Z'),
      end_date: new Date('2027-03-17T18:00:00Z'),
      timezone: 'America/New_York',
      location_type: 'in_person' as const,
      venue_name: 'Convention Center',
      venue_address: '123 Main St, New York, NY',
      max_attendees: 500,
    },
    {
      title: 'React Workshop 2027',
      slug: 'react-workshop-2027',
      description: 'Hands-on React workshop for intermediate developers.',
      event_type: 'workshop' as const,
      status: 'draft' as const,
      start_date: new Date('2027-04-10T09:00:00Z'),
      end_date: new Date('2027-04-10T17:00:00Z'),
      timezone: 'America/Los_Angeles',
      location_type: 'virtual' as const,
      max_attendees: 50,
    },
    {
      title: 'Startup Expo 2027',
      slug: 'startup-expo-2027',
      description: 'Connect with innovative startups and investors.',
      event_type: 'expo' as const,
      status: 'ongoing' as const,
      start_date: new Date('2027-01-01T09:00:00Z'),
      end_date: new Date('2028-12-31T18:00:00Z'),
      timezone: 'UTC',
      location_type: 'hybrid' as const,
      venue_name: 'Innovation Hub',
      venue_address: '456 Tech Blvd, San Francisco, CA',
    },
  ]

  for (const eventData of events) {
    const event = await prisma.event.upsert({
      where: { slug: eventData.slug },
      update: {},
      create: { ...eventData, organizer_id: organizer.id },
    })

    // Add invitations
    for (let i = 0; i < 5; i++) {
      const tokenHash = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex')
      await prisma.invitation.upsert({
        where: { event_id_email: { event_id: event.id, email: `attendee${i}@demo.com` } },
        update: {},
        create: {
          event_id: event.id,
          email: `attendee${i}@demo.com`,
          full_name: `Demo Attendee ${i + 1}`,
          token_hash: tokenHash,
          status: i < 2 ? 'accepted' : i < 3 ? 'declined' : 'sent',
        },
      })
    }

    // Add sponsors
    const tiers = ['platinum', 'gold', 'silver'] as const
    for (let i = 0; i < 3; i++) {
      const existingSponsor = await prisma.sponsor.findFirst({
        where: { event_id: event.id, company_name: `Sponsor ${i + 1}` },
      })
      if (!existingSponsor) {
        const sp = await prisma.sponsor.create({
          data: {
            event_id: event.id,
            user_id: i === 0 ? sponsor.id : null,
            company_name: `Sponsor ${i + 1}`,
            tier: tiers[i],
            website_url: `https://sponsor${i + 1}.example.com`,
            description: `Sponsor ${i + 1} description`,
          },
        })

        // Add 10 leads per sponsor
        for (let j = 0; j < 10; j++) {
          await prisma.sponsorLead.create({
            data: {
              sponsor_id: sp.id,
              attendee_name: `Lead ${j + 1}`,
              attendee_email: `lead${j + 1}@demo.com`,
              interaction_type: j % 3 === 0 ? 'booth_visit' : j % 3 === 1 ? 'material_download' : 'meeting_request',
              notes: `Interested in our product line ${j + 1}`,
            },
          })
        }
      }
    }
  }

  console.log('Seeding complete!')
  console.log('Demo accounts:')
  console.log('  Organizer: organizer@demo.com / Password1')
  console.log('  Sponsor:   sponsor@demo.com / Password1')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
