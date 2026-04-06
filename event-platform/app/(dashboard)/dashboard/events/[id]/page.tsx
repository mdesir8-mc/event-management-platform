'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import EventForm from '@/components/forms/EventForm'
import { formatDateTimeInput } from '@/lib/datetime'

interface Event {
  id: string
  title: string
  description: string | null
  event_type: string
  start_date: string
  end_date: string
  timezone: string
  location_type: string
  venue_name: string | null
  venue_address: string | null
  max_attendees: number | null
  banner_image_url: string | null
  organizer_id: string
  status: string
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [id, setId] = useState('')

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    params.then(({ id: eventId }) => {
      setId(eventId)
      if (token) fetchEvent(eventId)
    })
  }, [token])

  async function fetchEvent(eventId: string) {
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.event) {
        router.replace('/dashboard/events')
        return
      }
      if (data.event.organizer_id !== user?.id && user?.role !== 'admin') {
        router.replace('/dashboard/events')
        return
      }
      setEvent(data.event)
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>
  }

  if (!event) return null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/dashboard/events" className="text-blue-600 hover:underline text-sm">My Events</Link>
        <span className="text-gray-400">/</span>
        <span className="text-sm text-gray-600">{event.title}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Event</h1>
      <div className="flex gap-2 mb-6">
        <Link
          href={`/dashboard/events/${id}/invitations`}
          className="text-sm text-blue-600 border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-50"
        >
          Invitations
        </Link>
        <Link
          href={`/dashboard/events/${id}/sponsors`}
          className="text-sm text-blue-600 border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-50"
        >
          Sponsors
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <EventForm
          mode="edit"
          initialData={{
            id,
            title: event.title,
            description: event.description ?? '',
            event_type: event.event_type,
            start_date: formatDateTimeInput(event.start_date, event.timezone),
            end_date: formatDateTimeInput(event.end_date, event.timezone),
            timezone: event.timezone,
            location_type: event.location_type,
            venue_name: event.venue_name ?? '',
            venue_address: event.venue_address ?? '',
            max_attendees: event.max_attendees?.toString() ?? '',
            banner_image_url: event.banner_image_url ?? '',
          }}
        />
      </div>
    </div>
  )
}
