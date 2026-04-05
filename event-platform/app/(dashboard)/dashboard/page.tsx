'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login')
      } else if (user.role === 'sponsor') {
        router.replace('/dashboard/sponsor-portal')
      } else {
        router.replace('/dashboard/events')
      }
    }
  }, [user, isLoading, router])

  return <div className="flex items-center justify-center min-h-screen text-gray-500">Redirecting...</div>
}
