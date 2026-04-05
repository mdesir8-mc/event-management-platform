'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          EventPlatform
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/search" className="text-gray-600 hover:text-gray-900 text-sm">
            Browse Events
          </Link>
          {user ? (
            <>
              {user.role === 'organizer' || user.role === 'admin' ? (
                <Link href="/dashboard/events" className="text-gray-600 hover:text-gray-900 text-sm">
                  My Events
                </Link>
              ) : null}
              {user.role === 'sponsor' && (
                <Link href="/dashboard/sponsor-portal" className="text-gray-600 hover:text-gray-900 text-sm">
                  Sponsor Portal
                </Link>
              )}
              <span className="text-sm text-gray-500">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
