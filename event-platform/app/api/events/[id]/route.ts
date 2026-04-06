import { prisma } from '@/lib/db'
import { requireAuth, requireEventOwnership } from '@/lib/middleware/auth'
import { updateEventSchema, VALID_TRANSITIONS } from '@/lib/validation/events'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/events/id/GET', RATE_LIMITS.apiGlobal)

    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { full_name: true, organization_name: true } },
        sponsors: { orderBy: { tier: 'asc' } },
        _count: { select: { invitations: true } },
      },
    })

    if (!event) throw new NotFoundError('Event not found')
    if (event.status === 'draft') {
      // Only organizer can view draft events
      try {
        const user = await requireAuth(request)
        if (user.id !== event.organizer_id && user.role !== 'admin') {
          throw new NotFoundError('Event not found')
        }
      } catch {
        throw new NotFoundError('Event not found')
      }
    }

    return Response.json({ event })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/events/id/PUT', RATE_LIMITS.apiGlobal)

    const { id } = await params
    const user = await requireAuth(request)
    await requireEventOwnership(id, user)

    const body = await request.json()
    const result = updateEventSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const data = result.data

    if (data.status) {
      const current = await prisma.event.findUnique({ where: { id }, select: { status: true } })
      if (!current) throw new NotFoundError('Event not found')
      if (!VALID_TRANSITIONS[current.status]?.includes(data.status)) {
        throw new ValidationError(`Cannot transition from ${current.status} to ${data.status}`)
      }
    }

    const updateData: Record<string, unknown> = { ...data }
    if (data.description) updateData.description = sanitizeText(data.description)
    if (data.start_date) updateData.start_date = new Date(data.start_date)
    if (data.end_date) updateData.end_date = new Date(data.end_date)
    if (data.banner_image_url === '') updateData.banner_image_url = null

    const event = await prisma.event.update({ where: { id }, data: updateData })
    return Response.json({ event })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/events/id/DELETE', RATE_LIMITS.apiGlobal)

    const { id } = await params
    const user = await requireAuth(request)
    await requireEventOwnership(id, user)

    await prisma.$transaction([
      prisma.sponsorLead.deleteMany({ where: { sponsor: { event_id: id } } }),
      prisma.sponsor.deleteMany({ where: { event_id: id } }),
      prisma.invitation.deleteMany({ where: { event_id: id } }),
      prisma.event.delete({ where: { id } }),
    ])

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
