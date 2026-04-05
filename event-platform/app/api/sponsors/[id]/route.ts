import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { updateSponsorSchema } from '@/lib/validation/sponsors'
import { handleApiError, ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsors/id/GET', RATE_LIMITS.apiGlobal)

    const { id } = await params
    const user = await requireAuth(request)

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: {
        event: {
          select: { title: true, start_date: true, end_date: true, status: true, organizer_id: true },
        },
      },
    })
    if (!sponsor) throw new NotFoundError('Sponsor not found')

    const isOrganizer = sponsor.event.organizer_id === user.id
    const isSponsorUser = sponsor.user_id === user.id
    if (!isOrganizer && !isSponsorUser && user.role !== 'admin') {
      throw new ForbiddenError('Access denied')
    }

    const { event: { organizer_id: _, ...event }, ...rest } = sponsor
    return Response.json({ sponsor: { ...rest, event } })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsors/id/PUT', RATE_LIMITS.apiGlobal)

    const { id } = await params
    const user = await requireAuth(request)

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: { event: { select: { organizer_id: true } } },
    })
    if (!sponsor) throw new NotFoundError('Sponsor not found')

    const isOrganizer = sponsor.event.organizer_id === user.id
    const isSponsorUser = sponsor.user_id === user.id
    if (!isOrganizer && !isSponsorUser && user.role !== 'admin') {
      throw new ForbiddenError('You do not have permission to update this sponsor')
    }

    const body = await request.json()
    const result = updateSponsorSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const data = result.data
    const updateData: Record<string, unknown> = { ...data }
    if (data.description) updateData.description = sanitizeText(data.description)
    if (data.logo_url === '') updateData.logo_url = null
    if (data.website_url === '') updateData.website_url = null

    const updated = await prisma.sponsor.update({ where: { id }, data: updateData })
    return Response.json({ sponsor: updated })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsors/id/DELETE', RATE_LIMITS.apiGlobal)

    const { id } = await params
    const user = await requireAuth(request)

    const sponsor = await prisma.sponsor.findUnique({
      where: { id },
      include: { event: { select: { organizer_id: true } } },
    })
    if (!sponsor) throw new NotFoundError('Sponsor not found')

    if (sponsor.event.organizer_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('You do not have permission to delete this sponsor')
    }

    await prisma.$transaction([
      prisma.sponsorLead.deleteMany({ where: { sponsor_id: id } }),
      prisma.sponsor.delete({ where: { id } }),
    ])

    return new Response(null, { status: 204 })
  } catch (error) {
    return handleApiError(error)
  }
}
