'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import StatusBadge from '@/components/ui/StatusBadge'

interface Sponsor {
  id: string
  company_name: string
  tier: string
  booth_number: string | null
  website_url: string | null
  _count?: { leads: number }
}

interface SponsorTableProps {
  sponsors: Sponsor[]
  onEdit: (sponsor: Sponsor) => void
  onDelete: (id: string) => void
}

export default function SponsorTable({ sponsors, onEdit, onDelete }: SponsorTableProps) {
  const { token } = useAuth()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await fetch(`/api/sponsors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      onDelete(id)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  if (sponsors.length === 0) {
    return <p className="text-stone-500 text-sm py-4">No sponsors added yet.</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left">
              <th className="pb-3 font-medium text-stone-700">Company</th>
              <th className="pb-3 font-medium text-stone-700">Tier</th>
              <th className="pb-3 font-medium text-stone-700">Booth</th>
              <th className="pb-3 font-medium text-stone-700">Website</th>
              <th className="pb-3 font-medium text-stone-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {sponsors.map((sponsor) => (
              <tr key={sponsor.id}>
                <td className="py-3 font-medium text-stone-900">{sponsor.company_name}</td>
                <td className="py-3">
                  <StatusBadge status={sponsor.tier as never} type="tier" />
                </td>
                <td className="py-3 text-stone-600">{sponsor.booth_number || '—'}</td>
                <td className="py-3 text-stone-600">
                  {sponsor.website_url ? (
                    <a
                      href={sponsor.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-800 hover:underline"
                    >
                      Visit
                    </a>
                  ) : '—'}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(sponsor)}
                      className="text-stone-800 hover:text-stone-600 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(sponsor.id)}
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
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Remove Sponsor</h3>
            <p className="text-stone-600 text-sm mb-4">
              Are you sure you want to remove this sponsor? This will also delete all their leads.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? 'Removing...' : 'Remove'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="text-stone-600 px-4 py-2 rounded-md text-sm border border-stone-300"
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
