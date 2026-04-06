import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { handleApiError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsor-portal/analytics', RATE_LIMITS.apiGlobal)

    const { sponsorId } = await params
    const user = await requireAuth(request)

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { id: true, user_id: true, company_name: true, tier: true },
    })
    if (!sponsor) throw new NotFoundError('Sponsor not found')
    if (sponsor.user_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('Access denied')
    }

    const [totalLeads, leadsByType, recentLeads] = await Promise.all([
      prisma.sponsorLead.count({ where: { sponsor_id: sponsorId } }),
      prisma.sponsorLead.groupBy({
        by: ['interaction_type'],
        where: { sponsor_id: sponsorId },
        _count: true,
      }),
      prisma.sponsorLead.findMany({
        where: { sponsor_id: sponsorId },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
    ])

    // Leads over time (daily counts for last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const leadsOverTime = await prisma.sponsorLead.findMany({
      where: { sponsor_id: sponsorId, created_at: { gte: thirtyDaysAgo } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    })

    const dailyCounts: Record<string, number> = {}
    for (const lead of leadsOverTime) {
      const day = lead.created_at.toISOString().split('T')[0]
      dailyCounts[day] = (dailyCounts[day] || 0) + 1
    }

    const leadsTimeSeries = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))

    return Response.json({
      totalLeads,
      leadsByType,
      leadsTimeSeries,
      recentLeads,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
