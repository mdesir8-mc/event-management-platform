import { prisma } from '@/lib/db'
import { requireAuth, requireEventOwnership } from '@/lib/middleware/auth'
import { sendInvitationSchema } from '@/lib/validation/invitations'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/errors'
import { generateInvitationToken, hashToken } from '@/lib/auth'
import { enqueueInvitationEmail } from '@/lib/emailQueue'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/invitations/GET', RATE_LIMITS.apiGlobal)

    const { id: eventId } = await params
    const user = await requireAuth(request)
    await requireEventOwnership(eventId, user)

    const invitations = await prisma.invitation.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        full_name: true,
        status: true,
        sent_at: true,
        opened_at: true,
        responded_at: true,
        created_at: true,
      },
    })

    const statusCounts = await prisma.invitation.groupBy({
      by: ['status'],
      where: { event_id: eventId },
      _count: true,
    })

    return Response.json({ invitations, statusCounts })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    checkRateLimit(getClientIp(request), `api/invitations/${eventId}`, RATE_LIMITS.invitations)

    const user = await requireAuth(request)
    await requireEventOwnership(eventId, user)

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, start_date: true, end_date: true, venue_name: true, location_type: true },
    })
    if (!event) throw new NotFoundError('Event not found')

    const body = await request.json()
    const result = sendInvitationSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const { email, full_name, custom_message } = result.data

    const token = generateInvitationToken()
    const token_hash = hashToken(token)

    const invitation = await prisma.invitation.upsert({
      where: { event_id_email: { event_id: eventId, email } },
      create: {
        event_id: eventId,
        email,
        full_name,
        token_hash,
        status: 'pending',
        custom_message,
      },
      update: {
        full_name,
        token_hash,
        status: 'pending',
        custom_message,
        sent_at: null,
        opened_at: null,
        responded_at: null,
      },
    })

    enqueueInvitationEmail({
      invitationId: invitation.id,
      to: email,
      name: full_name,
      eventData: {
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date,
        venue_name: event.venue_name,
        location_type: event.location_type,
      },
      token,
      customMessage: custom_message,
    })

    return Response.json({ invitation }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
