import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await prisma.event.findUnique({ where: { slug }, select: { title: true, description: true } })
  if (!event) return { title: 'Event Not Found' }
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? undefined,
  }
}

const TIER_ORDER = ['platinum', 'gold', 'silver', 'bronze']

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params

  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      organizer: { select: { full_name: true, organization_name: true } },
      sponsors: { orderBy: { tier: 'asc' } },
    },
  })

  if (!event || event.status === 'draft' || event.status === 'cancelled') {
    notFound()
  }

  const sponsorsByTier = TIER_ORDER.map((tier) => ({
    tier,
    sponsors: event.sponsors.filter((s) => s.tier === tier),
  })).filter((t) => t.sponsors.length > 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {event.banner_image_url && (
        <div className="relative h-64 rounded-xl overflow-hidden mb-6 bg-gray-100">
          <Image src={event.banner_image_url} alt={event.title} fill className="object-cover" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wide bg-blue-50 px-2 py-1 rounded">
            {event.event_type}
          </span>
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded capitalize">
            {event.location_type.replace('_', ' ')}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${
            event.status === 'ongoing' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {event.status}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Date</p>
            <p className="text-gray-900">
              {new Date(event.start_date).toLocaleDateString()} – {new Date(event.end_date).toLocaleDateString()}
            </p>
            <p className="text-gray-500 text-sm">{event.timezone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Location</p>
            {event.location_type === 'virtual' ? (
              <p className="text-gray-900">Virtual Event</p>
            ) : (
              <>
                <p className="text-gray-900">{event.venue_name || 'TBD'}</p>
                {event.venue_address && <p className="text-gray-500 text-sm">{event.venue_address}</p>}
              </>
            )}
          </div>
          {event.max_attendees && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Capacity</p>
              <p className="text-gray-900">{event.max_attendees} attendees</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">Organizer</p>
            <p className="text-gray-900">{event.organizer.organization_name || event.organizer.full_name}</p>
          </div>
        </div>

        {event.description && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About this Event</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}
      </div>

      {sponsorsByTier.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Our Sponsors</h2>
          {sponsorsByTier.map(({ tier, sponsors }) => (
            <div key={tier} className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3 capitalize">{tier}</h3>
              <div className="flex flex-wrap gap-4">
                {sponsors.map((sponsor) => (
                  <a
                    key={sponsor.id}
                    href={sponsor.website_url || '#'}
                    target={sponsor.website_url ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors"
                  >
                    {sponsor.logo_url && (
                      <Image
                        src={sponsor.logo_url}
                        alt={sponsor.company_name}
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    )}
                    <span className="font-medium text-gray-900">{sponsor.company_name}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
