'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import InvitationTable from '@/components/tables/InvitationTable'
import InvitationForm from '@/components/forms/InvitationForm'
import BulkInvitationForm from '@/components/forms/BulkInvitationForm'

interface Invitation {
  id: string
  email: string
  full_name: string | null
  status: string
  sent_at: string | null
  responded_at: string | null
}

interface StatusCount {
  status: string
  _count: number
}

export default function InvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [eventId, setEventId] = useState('')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ sent: number; failed: number; duplicates: number } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [user, authLoading, router])

  useEffect(() => {
    if (!showSendModal && !showBulkModal) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setShowSendModal(false); setShowBulkModal(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSendModal, showBulkModal])

  const fetchInvitations = useCallback(async (id: string) => {
    if (!token) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/events/${id}/invitations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        setInvitations(data.invitations || [])
        setStatusCounts(data.statusCounts || [])
      }
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id)
      if (token) fetchInvitations(id)
    })
  }, [token, fetchInvitations])

  const total = invitations.length
  const accepted = statusCounts.find((s) => s.status === 'accepted')?._count ?? 0
  const declined = statusCounts.find((s) => s.status === 'declined')?._count ?? 0
  const pending = statusCounts.find((s) => s.status === 'pending')?._count ?? 0

  if (authLoading) return <div role="status" className="flex items-center justify-center min-h-screen text-stone-500">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-2">
        <Link href="/dashboard/events" className="text-stone-800 hover:underline text-sm">My Events</Link>
        <span aria-hidden="true" className="text-stone-400">/</span>
        <Link href={`/dashboard/events/${eventId}`} className="text-stone-800 hover:underline text-sm">Event</Link>
        <span aria-hidden="true" className="text-stone-400">/</span>
        <span aria-current="page" className="text-sm text-stone-600">Invitations</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Invitations</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="text-stone-600 border border-stone-300 px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-50"
          >
            Bulk Upload
          </button>
          <button
            onClick={() => setShowSendModal(true)}
            className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-900"
          >
            Send Invitation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Sent', value: total, color: 'text-stone-900' },
          { label: 'Accepted', value: accepted, color: 'text-green-600' },
          { label: 'Declined', value: declined, color: 'text-red-700' },
          { label: 'Pending', value: pending, color: 'text-yellow-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-stone-50 rounded-xl border border-stone-200 p-4">
            <p className="text-xs text-stone-500 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {bulkResult && (
        <div role="status" aria-live="polite" className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-4 flex items-center justify-between">
          <span>Bulk upload complete: {bulkResult.sent} sent, {bulkResult.failed} failed, {bulkResult.duplicates} duplicates</span>
          <button
            aria-label="Dismiss bulk upload result"
            className="ml-4 underline"
            onClick={() => setBulkResult(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="bg-stone-50 rounded-xl border border-stone-200 p-6">
        {isLoading ? (
          <div role="status" aria-live="polite" className="text-center py-8 text-stone-500">Loading invitations...</div>
        ) : (
          <InvitationTable
            invitations={invitations}
            onResend={() => {
              setShowSendModal(true)
            }}
          />
        )}
      </div>

      {showSendModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-invitation-dialog-title"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
        >
          <div className="bg-stone-50 rounded-xl p-6 max-w-lg w-full">
            <h2 id="send-invitation-dialog-title" className="text-lg font-semibold text-stone-900 mb-4">Send Invitation</h2>
            <InvitationForm
              eventId={eventId}
              onSuccess={() => {
                setShowSendModal(false)
                fetchInvitations(eventId)
              }}
              onCancel={() => setShowSendModal(false)}
            />
          </div>
        </div>
      )}

      {showBulkModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-invitation-dialog-title"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
        >
          <div className="bg-stone-50 rounded-xl p-6 max-w-lg w-full">
            <h2 id="bulk-invitation-dialog-title" className="text-lg font-semibold text-stone-900 mb-4">Bulk Upload Invitations</h2>
            <BulkInvitationForm
              eventId={eventId}
              onSuccess={(results) => {
                setShowBulkModal(false)
                setBulkResult(results)
                fetchInvitations(eventId)
              }}
              onCancel={() => setShowBulkModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
