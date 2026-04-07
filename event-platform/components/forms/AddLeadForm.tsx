'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface AddLeadFormProps {
  sponsorId: string
  onSuccess: () => void
  onCancel: () => void
}

export default function AddLeadForm({ sponsorId, onSuccess, onCancel }: AddLeadFormProps) {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    attendee_name: '',
    attendee_email: '',
    interaction_type: 'booth_visit',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/sponsor-portal/${sponsorId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to add lead')
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
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="lead-name" className="block text-sm font-medium text-stone-700 mb-1">Name *</label>
          <input
            id="lead-name"
            name="attendee_name"
            type="text"
            required
            aria-required="true"
            minLength={2}
            value={form.attendee_name}
            onChange={handleChange}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
        <div>
          <label htmlFor="lead-email" className="block text-sm font-medium text-stone-700 mb-1">Email *</label>
          <input
            id="lead-email"
            name="attendee_email"
            type="email"
            required
            aria-required="true"
            value={form.attendee_email}
            onChange={handleChange}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="lead-type" className="block text-sm font-medium text-stone-700 mb-1">Interaction Type *</label>
        <select
          id="lead-type"
          name="interaction_type"
          required
          aria-required="true"
          value={form.interaction_type}
          onChange={handleChange}
          className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        >
          <option value="booth_visit">Booth Visit</option>
          <option value="material_download">Material Download</option>
          <option value="meeting_request">Meeting Request</option>
        </select>
      </div>

      <div>
        <label htmlFor="lead-notes" className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
        <textarea
          id="lead-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          value={form.notes}
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
          {isLoading ? 'Adding...' : 'Add Lead'}
        </button>
        <button type="button" onClick={onCancel} className="text-stone-600 px-4 py-2 rounded-md text-sm border border-stone-300">
          Cancel
        </button>
      </div>
    </form>
  )
}
