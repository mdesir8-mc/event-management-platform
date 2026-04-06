import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/auth'
import { respondSchema } from '@/lib/validation/invitations'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/errors'
import { sendConfirmationEmail } from '@/lib/email'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/invitations/token/GET', RATE_LIMITS.apiGlobal)

    const { token } = await params
    const token_hash = hashToken(token)

    const invitation = await prisma.invitation.findUnique({
      where: { token_hash },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            start_date: true,
            end_date: true,
            timezone: true,
            location_type: true,
            venue_name: true,
            venue_address: true,
            banner_image_url: true,
          },
        },
      },
    })

    if (!invitation) throw new NotFoundError('Invitation not found')

    // Track open
    if (!invitation.opened_at) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { opened_at: new Date(), status: invitation.status === 'sent' ? 'opened' : invitation.status },
      })
    }

    const { token_hash: _, ...safeInvitation } = invitation
    return Response.json({ invitation: safeInvitation })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    checkRateLimit(getClientIp(request), 'api/invitations/token/POST', RATE_LIMITS.apiGlobal)

    const { token } = await params
    const token_hash = hashToken(token)

    const invitation = await prisma.invitation.findUnique({
      where: { token_hash },
      include: {
        event: {
          select: { title: true, start_date: true, end_date: true, venue_name: true, location_type: true },
        },
      },
    })

    if (!invitation) throw new NotFoundError('Invitation not found')

    // Check expiry: 90 days after event end
    const expiry = new Date(invitation.event.end_date)
    expiry.setDate(expiry.getDate() + 90)
    if (new Date() > expiry) {
      throw new ValidationError('This invitation has expired')
    }

    if (invitation.status === 'accepted' || invitation.status === 'declined') {
      throw new ValidationError('You have already responded to this invitation')
    }

    const body = await request.json()
    const result = respondSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const { response } = result.data
    const newStatus = response === 'accepted' ? 'accepted' : 'declined'

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: newStatus, responded_at: new Date() },
    })

    // Send confirmation (fire and forget)
    sendConfirmationEmail(
      invitation.email,
      invitation.full_name ?? undefined,
      invitation.event,
      response === 'accepted'
    ).catch(() => {})

    return Response.json({ message: `Successfully ${newStatus} invitation`, status: newStatus })
  } catch (error) {
    return handleApiError(error)
  }
}
