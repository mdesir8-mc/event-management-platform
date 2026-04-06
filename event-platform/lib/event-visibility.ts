import type { AuthUser } from '@/lib/middleware/auth'

export function shouldIncludeAllOrganizerStatuses(
  organizerId: string | undefined,
  user: AuthUser | null
): boolean {
  if (!organizerId || !user) return false
  return user.role === 'admin' || user.id === organizerId
}
