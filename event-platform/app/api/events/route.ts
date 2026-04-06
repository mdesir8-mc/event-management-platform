import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { createEventSchema, eventQuerySchema } from '@/lib/validation/events'
import { handleApiError, ValidationError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { generateUniqueSlug } from '@/lib/slugify'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'
import { shouldIncludeAllOrganizerStatuses } from '@/lib/event-visibility'

export async function GET(request: Request) {
  try {
    checkRateLimit(getClientIp(request), 'api/events/GET', RATE_LIMITS.apiGlobal)

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)
    const result = eventQuerySchema.safeParse(query)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const { status, event_type, organizer_id, page, limit } = result.data

    let user = null
    if (organizer_id) {
      try {
        user = await requireAuth(request)
      } catch {
        user = null
      }
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    else if (!shouldIncludeAllOrganizerStatuses(organizer_id, user)) where.status = 'published'
    if (event_type) where.event_type = event_type
    if (organizer_id) where.organizer_id = organizer_id

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { start_date: 'asc' },
        include: {
          _count: { select: { sponsors: true, invitations: true } },
          organizer: { select: { full_name: true, organization_name: true } },
        },
      }),
      prisma.event.count({ where }),
    ])

    return Response.json({ events, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    checkRateLimit(getClientIp(request), 'api/events/POST', RATE_LIMITS.apiGlobal)

    const user = await requireAuth(request)
    if (user.role !== 'organizer' && user.role !== 'admin') {
      return Response.json({ error: 'Only organizers can create events', code: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await request.json()
    const result = createEventSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const data = result.data
    const slug = await generateUniqueSlug(data.title)

    const event = await prisma.event.create({
      data: {
        ...data,
        description: data.description ? sanitizeText(data.description) : undefined,
        slug,
        organizer_id: user.id,
        status: 'draft',
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        banner_image_url: data.banner_image_url || null,
      },
    })

    return Response.json({ event }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
