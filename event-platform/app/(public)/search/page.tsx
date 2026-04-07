'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Event {
  id: string
  title: string
  slug: string
  description: string | null
  event_type: string
  start_date: string
  end_date: string
  location_type: string
  venue_name: string | null
  banner_image_url: string | null
  organizer: { full_name: string; organization_name: string | null }
}

export default function SearchPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [filters, setFilters] = useState({
    query: '', event_type: '', location_type: '',
  })

  const fetchEvents = useCallback(async (currentPage = 1, currentFilters = filters) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20' })
      if (currentFilters.query) params.set('query', currentFilters.query)
      if (currentFilters.event_type) params.set('event_type', currentFilters.event_type)
      if (currentFilters.location_type) params.set('location_type', currentFilters.location_type)

      const res = await fetch(`/api/search/events?${params}`)
      const data = await res.json()
      setEvents(data.events || [])
      setTotal(data.total || 0)
      setPages(data.pages || 1)
      setPage(currentPage)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchEvents(1, filters)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchEvents(1, filters)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-stone-900 mb-6">Browse Events</h1>

      <form onSubmit={handleSearch} aria-label="Search and filter events" className="bg-stone-50 rounded-xl border border-stone-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="search-query" className="sr-only">Search events</label>
            <input
              id="search-query"
              type="text"
              placeholder="Search events..."
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>
          <div>
            <label htmlFor="filter-type" className="sr-only">Filter by event type</label>
            <select
              id="filter-type"
              value={filters.event_type}
              onChange={(e) => setFilters((f) => ({ ...f, event_type: e.target.value }))}
              className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="">All Types</option>
              {['conference', 'workshop', 'meetup', 'expo', 'other'].map((t) => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-location" className="sr-only">Filter by location type</label>
            <select
              id="filter-location"
              value={filters.location_type}
              onChange={(e) => setFilters((f) => ({ ...f, location_type: e.target.value }))}
              className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="">All Locations</option>
              <option value="in_person">In Person</option>
              <option value="virtual">Virtual</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-stone-800 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-stone-900"
          >
            Search
          </button>
        </div>
      </form>

      {isLoading ? (
        <div role="status" aria-live="polite" className="text-center py-12 text-stone-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div role="status" className="text-center py-12 text-stone-500">No events found matching your criteria.</div>
      ) : (
        <>
          <p role="status" aria-live="polite" className="text-sm text-stone-600 mb-4">{total} events found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.slug}`} aria-label={`View event: ${event.title}`}>
                <div className="bg-stone-50 rounded-xl border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all overflow-hidden">
                  {event.banner_image_url && (
                    <div className="relative h-40 bg-stone-100">
                      <Image
                        src={event.banner_image_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <span className="text-xs font-medium text-stone-800 uppercase tracking-wide">{event.event_type}</span>
                    <h3 className="font-semibold text-stone-900 mt-1 line-clamp-2">{event.title}</h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {new Date(event.start_date).toLocaleDateString()} &bull;{' '}
                      {event.location_type === 'virtual' ? 'Virtual' : event.venue_name || 'TBD'}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">
                      By {event.organizer.organization_name || event.organizer.full_name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pages > 1 && (
            <nav aria-label="Search results pagination" className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => fetchEvents(page - 1)}
                disabled={page <= 1}
                aria-label="Previous page of search results"
                className="px-4 py-2 text-sm border rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span aria-current="page" className="px-4 py-2 text-sm text-stone-600">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => fetchEvents(page + 1)}
                disabled={page >= pages}
                aria-label="Next page of search results"
                className="px-4 py-2 text-sm border rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
