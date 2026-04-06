import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Navbar from '@/components/ui/Navbar'

export const metadata: Metadata = {
  title: 'EventPlatform - Manage & Discover Events',
  description: 'A platform for event organizers, sponsors, and attendees.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50 font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
