import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/errors'

export interface AuthUser {
  id: string
  email: string
  role: string
  full_name: string
  organization_name: string | null
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header')
  }

  const token = authHeader.slice(7)
  let payload: { sub: string; email: string }

  try {
    payload = verifyJWT(token)
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, full_name: true, organization_name: true },
  })

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  return user
}

export async function requireOrganizer(request: Request): Promise<AuthUser> {
  const user = await requireAuth(request)
  if (user.role !== 'organizer' && user.role !== 'admin') {
    throw new ForbiddenError('Only organizers can perform this action')
  }
  return user
}

export async function requireOwnership(
  organizerId: string,
  currentUserId: string,
  currentUserRole: string
): Promise<void> {
  if (currentUserRole === 'admin') return
  if (organizerId !== currentUserId) {
    throw new ForbiddenError('You do not have permission to modify this resource')
  }
}

export async function requireEventOwnership(
  eventId: string,
  currentUser: AuthUser
): Promise<{ id: string; organizer_id: string }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizer_id: true },
  })

  if (!event) {
    throw new NotFoundError('Event not found')
  }

  await requireOwnership(event.organizer_id, currentUser.id, currentUser.role)
  return event
}
