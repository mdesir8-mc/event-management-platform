'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import StatusBadge from '@/components/ui/StatusBadge'

interface SponsorEvent {
  id: string
  company_name: string
  tier: string
  event: {
    id: string
    title: string
    start_date: string
    end_date: string
    status: string
    banner_image_url: string | null
  }
  _count: { leads: number }
}

export default function SponsorPortalPage() {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [sponsors, setSponsors] = useState<SponsorEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
    if (!authLoading && user && user.role !== 'sponsor' && user.role !== 'admin') {
      router.replace('/dashboard/events')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!token) return
    fetch('/api/sponsor-portal/events', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSponsors(data.sponsors || []))
      .finally(() => setIsLoading(false))
  }, [token])

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sponsor Portal</h1>

      {sponsors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          <p>You are not linked to any events as a sponsor yet.</p>
          <p className="text-sm mt-2">Contact an event organizer to get linked to your sponsorship.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => (
            <Link key={sponsor.id} href={`/dashboard/sponsor-portal/${sponsor.id}`}>
              <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{sponsor.event.title}</h3>
                  <StatusBadge status={sponsor.event.status as never} type="event" />
                </div>
                <p className="text-sm text-gray-600 mb-2">{sponsor.company_name}</p>
                <div className="flex items-center justify-between">
                  <StatusBadge status={sponsor.tier as never} type="tier" />
                  <span className="text-sm text-gray-500">{sponsor._count.leads} leads</span>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  {new Date(sponsor.event.start_date).toLocaleDateString()} –{' '}
                  {new Date(sponsor.event.end_date).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
