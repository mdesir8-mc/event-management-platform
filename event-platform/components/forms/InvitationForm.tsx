'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface InvitationFormProps {
  eventId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function InvitationForm({ eventId, onSuccess, onCancel }: InvitationFormProps) {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', full_name: '', custom_message: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/events/${eventId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send invitation')
        return
      }

      onSuccess()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}
      <div>
        <label htmlFor="inv-email" className="block text-sm font-medium text-stone-700 mb-1">Email *</label>
        <input
          id="inv-email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>
      <div>
        <label htmlFor="inv-name" className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
        <input
          id="inv-name"
          name="full_name"
          type="text"
          value={form.full_name}
          onChange={handleChange}
          className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>
      <div>
        <label htmlFor="inv-message" className="block text-sm font-medium text-stone-700 mb-1">
          Custom Message <span className="text-stone-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="inv-message"
          name="custom_message"
          rows={3}
          maxLength={1000}
          value={form.custom_message}
          onChange={handleChange}
          className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-900 disabled:opacity-50"
        >
          {isLoading ? 'Sending...' : 'Send Invitation'}
        </button>
        <button type="button" onClick={onCancel} className="text-stone-600 px-4 py-2 rounded-md text-sm border border-stone-300">
          Cancel
        </button>
      </div>
    </form>
  )
}
