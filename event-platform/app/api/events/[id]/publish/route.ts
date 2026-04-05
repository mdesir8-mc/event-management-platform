import { prisma } from '@/lib/db'
import { requireAuth, requireEventOwnership } from '@/lib/middleware/auth'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/events/publish', RATE_LIMITS.apiGlobal)

    const { id } = await params
    const user = await requireAuth(request)
    await requireEventOwnership(id, user)

    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) throw new NotFoundError('Event not found')

    if (event.status !== 'draft') {
      throw new ValidationError(`Cannot publish event with status: ${event.status}`)
    }

    if (!event.title || !event.start_date || !event.end_date || !event.timezone) {
      throw new ValidationError('Event must have title, dates, and timezone before publishing')
    }

    if (new Date(event.start_date) <= new Date()) {
      throw new ValidationError('Event start date must be in the future')
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: 'published' },
    })

    return Response.json({ event: updated })
  } catch (error) {
    return handleApiError(error)
  }
}
