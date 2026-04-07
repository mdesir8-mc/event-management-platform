'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import EventTable from '@/components/tables/EventTable'

const STATUSES = ['all', 'draft', 'published', 'ongoing', 'completed', 'cancelled']

interface Event {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  status: string
  slug: string
}

export default function EventsDashboard() {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || !token) return
    fetchEvents()
  }, [user, token])

  async function fetchEvents() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ organizer_id: user!.id, limit: '100' })
      if (activeTab !== 'all') params.set('status', activeTab)
      const res = await fetch(`/api/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setEvents(data.events || [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && token) fetchEvents()
  }, [activeTab])

  const filtered = activeTab === 'all' ? events : events.filter((e) => e.status === activeTab)

  if (authLoading) return <div className="flex items-center justify-center min-h-screen text-stone-500">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">My Events</h1>
        <Link
          href="/dashboard/events/new"
          className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-900"
        >
          + Create Event
        </Link>
      </div>

      <div role="tablist" aria-label="Filter events by status" className="flex gap-1 mb-4 overflow-x-auto">
        {STATUSES.map((status) => (
          <button
            key={status}
            role="tab"
            aria-selected={activeTab === status}
            onClick={() => setActiveTab(status)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize whitespace-nowrap ${
              activeTab === status
                ? 'bg-stone-800 text-white'
                : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
        {isLoading ? (
          <div role="status" aria-live="polite" className="text-center py-8 text-stone-500">Loading events...</div>
        ) : (
          <EventTable
            events={filtered}
            onDelete={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))}
            onPublish={(id) =>
              setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'published' } : e)))
            }
          />
        )}
      </div>
    </div>
  )
}
