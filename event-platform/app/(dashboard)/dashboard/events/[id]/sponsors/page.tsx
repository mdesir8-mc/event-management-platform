'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import SponsorTable from '@/components/tables/SponsorTable'
import SponsorForm from '@/components/forms/SponsorForm'

interface Sponsor {
  id: string
  company_name: string
  tier: string
  booth_number: string | null
  website_url: string | null
  _count?: { leads: number }
}

export default function SponsorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [eventId, setEventId] = useState('')
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  const fetchSponsors = useCallback(async (id: string) => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/events/${id}/sponsors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) setSponsors(data.sponsors || [])
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id)
      if (token) fetchSponsors(id)
    })
  }, [token, fetchSponsors])

  const tierCounts = ['platinum', 'gold', 'silver', 'bronze'].map((tier) => ({
    tier,
    count: sponsors.filter((s) => s.tier === tier).length,
  }))

  if (authLoading) return <div className="flex items-center justify-center min-h-screen text-stone-500">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/dashboard/events" className="text-stone-800 hover:underline text-sm">My Events</Link>
        <span className="text-stone-400">/</span>
        <Link href={`/dashboard/events/${eventId}`} className="text-stone-800 hover:underline text-sm">Event</Link>
        <span className="text-stone-400">/</span>
        <span className="text-sm text-stone-600">Sponsors</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Sponsors</h1>
        <button
          onClick={() => { setEditingSponsor(null); setShowModal(true) }}
          className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-900"
        >
          Add Sponsor
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {tierCounts.map(({ tier, count }) => (
          <div key={tier} className="bg-stone-50 rounded-xl border border-stone-200 p-4">
            <p className="text-xs text-stone-500 mb-1 capitalize">{tier}</p>
            <p className="text-2xl font-bold text-stone-900">{count}</p>
          </div>
        ))}
      </div>

      <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
        {isLoading ? (
          <div className="text-center py-8 text-stone-500">Loading sponsors...</div>
        ) : (
          <SponsorTable
            sponsors={sponsors}
            onEdit={(sponsor) => { setEditingSponsor(sponsor); setShowModal(true) }}
            onDelete={(id) => setSponsors((prev) => prev.filter((s) => s.id !== id))}
          />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-stone-50 rounded-xl p-6 max-w-lg w-full max-h-screen overflow-y-auto">
            <h2 className="text-lg font-semibold text-stone-900 mb-4">
              {editingSponsor ? 'Edit Sponsor' : 'Add Sponsor'}
            </h2>
            <SponsorForm
              eventId={eventId}
              mode={editingSponsor ? 'edit' : 'create'}
              initialData={editingSponsor ? {
                ...editingSponsor,
                website_url: editingSponsor.website_url ?? undefined,
                booth_number: editingSponsor.booth_number ?? undefined,
              } : undefined}
              onSuccess={() => {
                setShowModal(false)
                fetchSponsors(eventId)
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
