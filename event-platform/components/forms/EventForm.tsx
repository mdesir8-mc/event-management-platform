'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { normalizeDateTimeInput } from '@/lib/datetime'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai', 'Australia/Sydney', 'UTC',
]

interface EventFormData {
  title: string
  description: string
  event_type: string
  start_date: string
  end_date: string
  timezone: string
  location_type: string
  venue_name: string
  venue_address: string
  max_attendees: string
  banner_image_url: string
}

interface EventFormProps {
  initialData?: Partial<EventFormData> & { id?: string }
  mode: 'create' | 'edit'
}

export default function EventForm({ initialData, mode }: EventFormProps) {
  const { token } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<EventFormData>({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    event_type: initialData?.event_type ?? 'conference',
    start_date: initialData?.start_date ?? '',
    end_date: initialData?.end_date ?? '',
    timezone: initialData?.timezone ?? 'UTC',
    location_type: initialData?.location_type ?? 'in_person',
    venue_name: initialData?.venue_name ?? '',
    venue_address: initialData?.venue_address ?? '',
    max_attendees: initialData?.max_attendees ?? '',
    banner_image_url: initialData?.banner_image_url ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const payload = {
      ...form,
      start_date: normalizeDateTimeInput(form.start_date, form.timezone),
      end_date: normalizeDateTimeInput(form.end_date, form.timezone),
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : undefined,
      venue_name: form.location_type !== 'virtual' ? form.venue_name : undefined,
      venue_address: form.location_type !== 'virtual' ? form.venue_address : undefined,
    }

    try {
      const url = mode === 'create' ? '/api/events' : `/api/events/${initialData?.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      router.push('/dashboard/events')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">
          Event Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          aria-required="true"
          minLength={3}
          maxLength={200}
          value={form.title}
          onChange={handleChange}
          className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={10000}
          value={form.description}
          onChange={handleChange}
          className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="event_type" className="block text-sm font-medium text-stone-700 mb-1">
            Event Type *
          </label>
          <select
            id="event_type"
            name="event_type"
            required
            aria-required="true"
            value={form.event_type}
            onChange={handleChange}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          >
            {['conference', 'workshop', 'meetup', 'expo', 'other'].map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-stone-700 mb-1">
            Timezone *
          </label>
          <select
            id="timezone"
            name="timezone"
            required
            aria-required="true"
            value={form.timezone}
            onChange={handleChange}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-stone-700 mb-1">
            Start Date & Time *
          </label>
          <input
            id="start_date"
            name="start_date"
            type="datetime-local"
            required
            aria-required="true"
            value={form.start_date}
            onChange={handleChange}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-stone-700 mb-1">
            End Date & Time *
          </label>
          <input
            id="end_date"
            name="end_date"
            type="datetime-local"
            required
            aria-required="true"
            value={form.end_date}
            onChange={handleChange}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">Location Type *</label>
        <div className="flex gap-4">
          {['in_person', 'virtual', 'hybrid'].map((lt) => (
            <label key={lt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="location_type"
                value={lt}
                checked={form.location_type === lt}
                onChange={handleChange}
              />
              <span className="text-sm capitalize">{lt.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {form.location_type !== 'virtual' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="venue_name" className="block text-sm font-medium text-stone-700 mb-1">
              Venue Name
            </label>
            <input
              id="venue_name"
              name="venue_name"
              type="text"
              value={form.venue_name}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>
          <div>
            <label htmlFor="venue_address" className="block text-sm font-medium text-stone-700 mb-1">
              Venue Address
            </label>
            <input
              id="venue_address"
              name="venue_address"
              type="text"
              value={form.venue_address}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="max_attendees" className="block text-sm font-medium text-stone-700 mb-1">
            Max Attendees
          </label>
          <input
            id="max_attendees"
            name="max_attendees"
            type="number"
            min={1}
            value={form.max_attendees}
            onChange={handleChange}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="banner_image_url" className="block text-sm font-medium text-stone-700 mb-1">
            Banner Image URL
          </label>
          <input
            id="banner_image_url"
            name="banner_image_url"
            type="url"
            value={form.banner_image_url}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm border border-stone-300 rounded-md hover:bg-stone-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm bg-stone-800 text-white rounded-md hover:bg-stone-900 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
