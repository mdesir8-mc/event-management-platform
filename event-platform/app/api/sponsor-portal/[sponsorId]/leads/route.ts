import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { createLeadSchema, leadsQuerySchema } from '@/lib/validation/sponsors'
import { handleApiError, ValidationError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { sanitizeText } from '@/lib/sanitize'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

async function verifySponsorOwnership(sponsorId: string, userId: string, userRole: string) {
  const sponsor = await prisma.sponsor.findUnique({
    where: { id: sponsorId },
    select: { id: true, user_id: true },
  })
  if (!sponsor) throw new NotFoundError('Sponsor not found')
  if (sponsor.user_id !== userId && userRole !== 'admin') {
    throw new ForbiddenError('Access denied')
  }
  return sponsor
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsor-portal/leads/GET', RATE_LIMITS.apiGlobal)

    const { sponsorId } = await params
    const user = await requireAuth(request)
    await verifySponsorOwnership(sponsorId, user.id, user.role)

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)
    const result = leadsQuerySchema.safeParse(query)
    if (!result.success) throw new ValidationError(result.error.issues[0].message)

    const { page, limit } = result.data
    const [leads, total] = await Promise.all([
      prisma.sponsorLead.findMany({
        where: { sponsor_id: sponsorId },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sponsorLead.count({ where: { sponsor_id: sponsorId } }),
    ])

    return Response.json({ leads, total, page, limit, pages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsor-portal/leads/POST', RATE_LIMITS.apiGlobal)

    const { sponsorId } = await params
    const user = await requireAuth(request)
    await verifySponsorOwnership(sponsorId, user.id, user.role)

    const body = await request.json()
    const result = createLeadSchema.safeParse(body)
    if (!result.success) throw new ValidationError(result.error.issues[0].message)

    const data = result.data
    const lead = await prisma.sponsorLead.create({
      data: {
        sponsor_id: sponsorId,
        attendee_name: sanitizeText(data.attendee_name),
        attendee_email: data.attendee_email,
        interaction_type: data.interaction_type,
        notes: data.notes ? sanitizeText(data.notes) : undefined,
      },
    })

    return Response.json({ lead }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
