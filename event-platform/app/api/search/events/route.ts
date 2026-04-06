import { prisma } from '@/lib/db'
import { searchEventsSchema } from '@/lib/validation/events'
import { handleApiError, ValidationError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(request: Request) {
  try {
    checkRateLimit(getClientIp(request), 'api/search/events', RATE_LIMITS.apiGlobal)

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)
    const result = searchEventsSchema.safeParse(query)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const { query: searchQuery, event_type, location_type, start_date, end_date, page, limit } = result.data

    const where: Record<string, unknown> = { status: 'published' }

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
      ]
    }
    if (event_type) where.event_type = event_type
    if (location_type) where.location_type = location_type
    if (start_date) where.start_date = { gte: new Date(start_date) }
    if (end_date) where.end_date = { lte: new Date(end_date) }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { start_date: 'asc' },
        include: {
          organizer: { select: { full_name: true, organization_name: true } },
          _count: { select: { sponsors: true } },
        },
      }),
      prisma.event.count({ where }),
    ])

    return Response.json({ events, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}
