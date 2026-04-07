'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface InvitationData {
  id: string
  email: string
  full_name: string | null
  status: string
  event: {
    id: string
    title: string
    start_date: string
    end_date: string
    timezone: string
    location_type: string
    venue_name: string | null
    venue_address: string | null
    description: string | null
  }
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [responded, setResponded] = useState(false)
  const [responseStatus, setResponseStatus] = useState('')
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t)
      fetchInvitation(t)
      const autoResponse = searchParams.get('response')
      if (autoResponse === 'accept' || autoResponse === 'decline') {
        respondToInvitation(t, autoResponse === 'accept' ? 'accepted' : 'declined')
      }
    })
  }, [])

  async function fetchInvitation(t: string) {
    try {
      const res = await fetch(`/api/invitations/${t}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invitation not found')
        return
      }
      setInvitation(data.invitation)
      if (data.invitation.status === 'accepted' || data.invitation.status === 'declined') {
        setResponded(true)
        setResponseStatus(data.invitation.status)
      }
    } catch {
      setError('Failed to load invitation')
    } finally {
      setIsLoading(false)
    }
  }

  async function respondToInvitation(t: string, response: 'accepted' | 'declined') {
    setIsResponding(true)
    try {
      const res = await fetch(`/api/invitations/${t}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error !== 'You have already responded to this invitation') {
          setError(data.error || 'Failed to submit response')
        }
        return
      }
      setResponded(true)
      setResponseStatus(response)
    } finally {
      setIsResponding(false)
    }
  }

  function generateICS() {
    if (!invitation) return
    const { event } = invitation
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${new Date(event.end_date).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.venue_name || 'Virtual Event'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'event.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-stone-500">Loading invitation...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md text-center">
          <h2 className="font-semibold mb-2">Invitation Not Found</h2>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm p-8 max-w-lg w-full">
        {responded ? (
          <div className="text-center">
            <div className={`text-4xl mb-4`}>{responseStatus === 'accepted' ? '🎉' : '👋'}</div>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">
              {responseStatus === 'accepted' ? 'See you there!' : 'Maybe next time!'}
            </h1>
            <p className="text-stone-600 mb-6">
              {responseStatus === 'accepted'
                ? `You've accepted the invitation to ${invitation.event.title}.`
                : `You've declined the invitation to ${invitation.event.title}.`}
            </p>
            {responseStatus === 'accepted' && (
              <button
                onClick={generateICS}
                className="bg-stone-800 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-stone-900"
              >
                Add to Calendar
              </button>
            )}
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-stone-900 mb-2">You&apos;re Invited!</h1>
            {invitation.full_name && (
              <p className="text-stone-600 mb-4">Hi {invitation.full_name},</p>
            )}

            <div className="bg-stone-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-stone-900 text-lg mb-3">{invitation.event.title}</h2>
              <div className="space-y-2 text-sm text-stone-600">
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {new Date(invitation.event.start_date).toLocaleDateString()} –{' '}
                  {new Date(invitation.event.end_date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Location:</span>{' '}
                  {invitation.event.location_type === 'virtual'
                    ? 'Virtual Event'
                    : invitation.event.venue_name || 'TBD'}
                </p>
                {invitation.event.venue_address && (
                  <p><span className="font-medium">Address:</span> {invitation.event.venue_address}</p>
                )}
              </div>
            </div>

            {invitation.event.description && (
              <p className="text-stone-600 text-sm mb-6 line-clamp-3">{invitation.event.description}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => respondToInvitation(token, 'accepted')}
                disabled={isResponding}
                className="flex-1 bg-green-600 text-white py-3 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isResponding ? '...' : 'Accept'}
              </button>
              <button
                onClick={() => respondToInvitation(token, 'declined')}
                disabled={isResponding}
                className="flex-1 bg-red-50 text-red-700 border border-red-200 py-3 rounded-md font-medium hover:bg-red-100 disabled:opacity-50"
              >
                {isResponding ? '...' : 'Decline'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
