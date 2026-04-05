import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { handleApiError, NotFoundError, ForbiddenError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sponsorId: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/sponsor-portal/leads/export', RATE_LIMITS.apiGlobal)

    const { sponsorId } = await params
    const user = await requireAuth(request)

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: sponsorId },
      select: { id: true, user_id: true, company_name: true },
    })
    if (!sponsor) throw new NotFoundError('Sponsor not found')
    if (sponsor.user_id !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('Access denied')
    }

    const leads = await prisma.sponsorLead.findMany({
      where: { sponsor_id: sponsorId },
      orderBy: { created_at: 'desc' },
    })

    const header = 'Name,Email,Interaction Type,Notes,Date\n'
    const rows = leads.map((lead) => {
      const name = `"${lead.attendee_name.replace(/"/g, '""')}"`
      const email = `"${lead.attendee_email.replace(/"/g, '""')}"`
      const type = `"${lead.interaction_type}"`
      const notes = `"${(lead.notes || '').replace(/"/g, '""')}"`
      const date = `"${lead.created_at.toISOString()}"`
      return `${name},${email},${type},${notes},${date}`
    })

    const csv = header + rows.join('\n')
    const filename = `leads-${sponsor.company_name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
