'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface SponsorFormData {
  company_name: string
  tier: string
  logo_url: string
  website_url: string
  description: string
  booth_number: string
  user_id: string
}

interface SponsorFormProps {
  eventId: string
  initialData?: Partial<SponsorFormData> & { id?: string }
  mode: 'create' | 'edit'
  onSuccess: () => void
  onCancel: () => void
}

export default function SponsorForm({ eventId, initialData, mode, onSuccess, onCancel }: SponsorFormProps) {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<SponsorFormData>({
    company_name: initialData?.company_name ?? '',
    tier: initialData?.tier ?? 'silver',
    logo_url: initialData?.logo_url ?? '',
    website_url: initialData?.website_url ?? '',
    description: initialData?.description ?? '',
    booth_number: initialData?.booth_number ?? '',
    user_id: initialData?.user_id ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const payload = { ...form, user_id: form.user_id || undefined }

    try {
      const url = mode === 'create'
        ? `/api/events/${eventId}/sponsors`
        : `/api/sponsors/${initialData?.id}`
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save sponsor')
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sp-name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input
            id="sp-name"
            name="company_name"
            type="text"
            required
            minLength={2}
            value={form.company_name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="sp-tier" className="block text-sm font-medium text-gray-700 mb-1">Tier *</label>
          <select
            id="sp-tier"
            name="tier"
            required
            value={form.tier}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['platinum', 'gold', 'silver', 'bronze'].map((t) => (
              <option key={t} value={t} className="capitalize">{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sp-website" className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input
            id="sp-website"
            name="website_url"
            type="url"
            value={form.website_url}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="sp-booth" className="block text-sm font-medium text-gray-700 mb-1">Booth Number</label>
          <input
            id="sp-booth"
            name="booth_number"
            type="text"
            maxLength={50}
            value={form.booth_number}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="sp-logo" className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
        <input
          id="sp-logo"
          name="logo_url"
          type="url"
          value={form.logo_url}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="sp-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          id="sp-desc"
          name="description"
          rows={3}
          maxLength={5000}
          value={form.description}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="sp-user" className="block text-sm font-medium text-gray-700 mb-1">
          Sponsor User ID <span className="text-gray-400 font-normal">(optional, links to sponsor account)</span>
        </label>
        <input
          id="sp-user"
          name="user_id"
          type="text"
          value={form.user_id}
          onChange={handleChange}
          placeholder="UUID of sponsor user"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Add Sponsor' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel} className="text-gray-600 px-4 py-2 rounded-md text-sm border border-gray-300">
          Cancel
        </button>
      </div>
    </form>
  )
}
