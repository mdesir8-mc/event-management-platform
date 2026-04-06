'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import StatusBadge from '@/components/ui/StatusBadge'

interface Event {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  status: string
  slug: string
}

interface EventTableProps {
  events: Event[]
  onDelete: (id: string) => void
  onPublish: (id: string) => void
}

export default function EventTable({ events, onDelete, onPublish }: EventTableProps) {
  const { token } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      onDelete(id)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  async function handlePublish(id: string) {
    const res = await fetch(`/api/events/${id}/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) onPublish(id)
  }

  if (events.length === 0) {
    return <p className="text-stone-500 text-sm py-4">No events found.</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left">
              <th className="pb-3 font-medium text-stone-700">Title</th>
              <th className="pb-3 font-medium text-stone-700">Type</th>
              <th className="pb-3 font-medium text-stone-700">Dates</th>
              <th className="pb-3 font-medium text-stone-700">Status</th>
              <th className="pb-3 font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="py-3 font-medium text-stone-900">{event.title}</td>
                <td className="py-3 text-stone-600 capitalize">{event.event_type}</td>
                <td className="py-3 text-stone-600">
                  {new Date(event.start_date).toLocaleDateString()} –{' '}
                  {new Date(event.end_date).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <StatusBadge status={event.status as never} type="event" />
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/events/${event.id}`}
                      className="text-stone-800 hover:text-stone-600 text-xs"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/dashboard/events/${event.id}/invitations`}
                      className="text-stone-600 hover:text-stone-700 text-xs"
                    >
                      Invitations
                    </Link>
                    <Link
                      href={`/dashboard/events/${event.id}/sponsors`}
                      className="text-stone-600 hover:text-stone-700 text-xs"
                    >
                      Sponsors
                    </Link>
                    {event.status === 'published' && (
                      <Link
                        href={`/events/${event.slug}`}
                        target="_blank"
                        className="text-stone-600 hover:text-stone-700 text-xs"
                      >
                        View
                      </Link>
                    )}
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(event.id)}
                        className="text-green-600 hover:text-green-700 text-xs"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDeleteId(event.id)}
                      className="text-red-700 hover:text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-stone-50 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Delete Event</h3>
            <p className="text-stone-600 text-sm mb-4">
              Are you sure you want to delete this event? This will also delete all invitations and sponsors.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-stone-600 px-4 py-2 rounded-md text-sm border border-stone-300 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
