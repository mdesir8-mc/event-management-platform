'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', role: 'organizer', organization_name: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organization_name: form.organization_name || undefined }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      login(data.token, data.user)

      if (data.user.role === 'sponsor') {
        router.push('/dashboard/sponsor-portal')
      } else {
        router.push('/dashboard/events')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Create Account</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              minLength={2}
              value={form.full_name}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-stone-700 mb-1">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
            <p className="text-xs text-stone-500 mt-1">Min 8 chars, one uppercase letter, one number</p>
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-stone-700 mb-1">Account Type</label>
            <select
              id="role"
              name="role"
              required
              value={form.role}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            >
              <option value="organizer">Event Organizer</option>
              <option value="sponsor">Sponsor</option>
            </select>
          </div>
          <div>
            <label htmlFor="organization_name" className="block text-sm font-medium text-stone-700 mb-1">
              Organization Name <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              id="organization_name"
              name="organization_name"
              type="text"
              value={form.organization_name}
              onChange={handleChange}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-stone-800 text-white py-2 rounded-md text-sm font-medium hover:bg-stone-900 disabled:opacity-50"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-600">
          Already have an account?{' '}
          <Link href="/login" className="text-stone-800 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
