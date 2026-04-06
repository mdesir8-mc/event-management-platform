'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

interface BulkInvitationFormProps {
  eventId: string
  onSuccess: (results: { sent: number; failed: number; duplicates: number }) => void
  onCancel: () => void
}

export default function BulkInvitationForm({ eventId, onSuccess, onCancel }: BulkInvitationFormProps) {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Array<{ email: string; full_name?: string }>>([])
  const [parsed, setParsed] = useState<Array<{ email: string; full_name?: string }>>([])

  function parseCSV(text: string) {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const emailIdx = headers.indexOf('email')
    const nameIdx = headers.indexOf('full_name') !== -1 ? headers.indexOf('full_name') : headers.indexOf('name')

    const rows = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      if (!cols[emailIdx]) continue
      rows.push({
        email: cols[emailIdx],
        full_name: nameIdx >= 0 ? cols[nameIdx] : undefined,
      })
    }
    return rows
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const rows = parseCSV(text)
      setParsed(rows)
      setPreview(rows.slice(0, 10))
    }
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const csv = 'email,full_name,custom_message\nexample@email.com,John Doe,Looking forward to seeing you!'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invitation-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (parsed.length === 0) {
      setError('Please upload a CSV file first')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/events/${eventId}/invitations/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(parsed),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send bulk invitations')
        return
      }

      onSuccess(data.results)
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

      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">Upload CSV File</label>
        <button type="button" onClick={downloadTemplate} className="text-xs text-blue-600 hover:underline">
          Download Template
        </button>
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {preview.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Preview (first {Math.min(10, preview.length)} of {parsed.length} rows):
          </p>
          <div className="overflow-x-auto max-h-40 border border-gray-200 rounded-md">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-600">Email</th>
                  <th className="px-3 py-2 text-left text-gray-600">Name</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-900">{row.email}</td>
                    <td className="px-3 py-2 text-gray-600">{row.full_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || parsed.length === 0}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Uploading...' : `Send ${parsed.length} Invitations`}
        </button>
        <button type="button" onClick={onCancel} className="text-gray-600 px-4 py-2 rounded-md text-sm border border-gray-300">
          Cancel
        </button>
      </div>
    </form>
  )
}
