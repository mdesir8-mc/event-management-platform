import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { handleApiError, ForbiddenError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(request: Request) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsor-portal/events', RATE_LIMITS.apiGlobal)

    const user = await requireAuth(request)
    if (user.role !== 'sponsor' && user.role !== 'admin') {
      throw new ForbiddenError('Only sponsor accounts can access the sponsor portal')
    }

    const sponsors = await prisma.sponsor.findMany({
      where: { user_id: user.id },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            start_date: true,
            end_date: true,
            status: true,
            banner_image_url: true,
          },
        },
        _count: { select: { leads: true } },
      },
      orderBy: { created_at: 'desc' },
    })

    return Response.json({ sponsors })
  } catch (error) {
    return handleApiError(error)
  }
}
