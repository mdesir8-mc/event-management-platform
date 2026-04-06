import { prisma } from '@/lib/db'
import { requireAuth, requireEventOwnership } from '@/lib/middleware/auth'
import { createSponsorSchema } from '@/lib/validation/sponsors'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsors/GET', RATE_LIMITS.apiGlobal)

    const { id: eventId } = await params
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } })
    if (!event) throw new NotFoundError('Event not found')

    const sponsors = await prisma.sponsor.findMany({
      where: { event_id: eventId },
      orderBy: { tier: 'asc' },
      include: { _count: { select: { leads: true } } },
    })

    return Response.json({ sponsors })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsors/POST', RATE_LIMITS.apiGlobal)

    const { id: eventId } = await params
    const user = await requireAuth(request)
    await requireEventOwnership(eventId, user)

    const body = await request.json()
    const result = createSponsorSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const data = result.data

    // Limit platinum sponsors to 5 per event
    if (data.tier === 'platinum') {
      const platinumCount = await prisma.sponsor.count({
        where: { event_id: eventId, tier: 'platinum' },
      })
      if (platinumCount >= 5) {
        throw new ValidationError('Maximum 5 platinum sponsors per event')
      }
    }

    const existing = await prisma.sponsor.findFirst({
      where: { event_id: eventId, company_name: { equals: data.company_name, mode: 'insensitive' } },
    })
    if (existing) {
      throw new ValidationError('A sponsor with this company name already exists for this event')
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        ...data,
        event_id: eventId,
        description: data.description ? sanitizeText(data.description) : undefined,
        logo_url: data.logo_url || null,
        website_url: data.website_url || null,
        user_id: data.user_id || null,
      },
    })

    return Response.json({ sponsor }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
