'use client'

import StatusBadge from '@/components/ui/StatusBadge'

interface Invitation {
  id: string
  email: string
  full_name: string | null
  status: string
  sent_at: string | null
  responded_at: string | null
}

interface InvitationTableProps {
  invitations: Invitation[]
  onResend: (invitation: Invitation) => void
}

export default function InvitationTable({ invitations, onResend }: InvitationTableProps) {
  if (invitations.length === 0) {
    return <p className="text-stone-500 text-sm py-4">No invitations sent yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left">
            <th className="pb-3 font-medium text-stone-700">Email</th>
            <th className="pb-3 font-medium text-stone-700">Name</th>
            <th className="pb-3 font-medium text-stone-700">Status</th>
            <th className="pb-3 font-medium text-stone-700">Sent</th>
            <th className="pb-3 font-medium text-stone-700">Responded</th>
            <th className="pb-3 font-medium text-stone-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {invitations.map((inv) => (
            <tr key={inv.id}>
              <td className="py-3 text-stone-900">{inv.email}</td>
              <td className="py-3 text-stone-600">{inv.full_name || '—'}</td>
              <td className="py-3">
                <StatusBadge status={inv.status as never} type="invitation" />
              </td>
              <td className="py-3 text-stone-600">
                {inv.sent_at ? new Date(inv.sent_at).toLocaleDateString() : '—'}
              </td>
              <td className="py-3 text-stone-600">
                {inv.responded_at ? new Date(inv.responded_at).toLocaleDateString() : '—'}
              </td>
              <td className="py-3">
                <button
                  onClick={() => onResend(inv)}
                  className="text-stone-800 hover:text-stone-600 text-xs"
                >
                  Resend
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
