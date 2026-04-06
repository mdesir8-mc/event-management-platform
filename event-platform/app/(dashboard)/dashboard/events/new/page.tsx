'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import EventForm from '@/components/forms/EventForm'

export default function NewEventPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
    if (!isLoading && user && user.role !== 'organizer' && user.role !== 'admin') {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <EventForm mode="create" />
      </div>
    </div>
  )
}
