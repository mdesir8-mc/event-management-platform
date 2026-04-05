import { prisma } from '@/lib/db'
import { requireAuth, requireEventOwnership } from '@/lib/middleware/auth'
import { handleApiError, ValidationError, NotFoundError } from '@/lib/errors'
import { generateInvitationToken, hashToken } from '@/lib/auth'
import { enqueueInvitationEmail } from '@/lib/emailQueue'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'
import { z } from 'zod'

const bulkRowSchema = z.object({
  email: z.string().email(),
  full_name: z.string().optional(),
  custom_message: z.string().max(1000).optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    checkRateLimit(getClientIp(request), `api/invitations/bulk/${eventId}`, RATE_LIMITS.invitations)

    const user = await requireAuth(request)
    await requireEventOwnership(eventId, user)

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, title: true, start_date: true, end_date: true, venue_name: true, location_type: true },
    })
    if (!event) throw new NotFoundError('Event not found')

    const body = await request.json()
    if (!Array.isArray(body) || body.length === 0) {
      throw new ValidationError('Request body must be a non-empty array')
    }
    if (body.length > 1000) {
      throw new ValidationError('Maximum 1000 invitations per bulk upload')
    }

    const results = { sent: 0, failed: 0, duplicates: 0, errors: [] as string[] }
    const seenEmails = new Set<string>()

    const existingInvitations = await prisma.invitation.findMany({
      where: { event_id: eventId },
      select: { email: true },
    })
    const existingEmails = new Set(existingInvitations.map((i) => i.email))

    for (const row of body) {
      const parsed = bulkRowSchema.safeParse(row)
      if (!parsed.success) {
        results.failed++
        results.errors.push(`Invalid row: ${JSON.stringify(row)}`)
        continue
      }

      const { email, full_name, custom_message } = parsed.data

      if (seenEmails.has(email)) {
        results.duplicates++
        continue
      }
      seenEmails.add(email)

      if (existingEmails.has(email)) {
        results.duplicates++
        continue
      }

      try {
        const token = generateInvitationToken()
        const token_hash = hashToken(token)

        const invitation = await prisma.invitation.create({
          data: { event_id: eventId, email, full_name, token_hash, status: 'pending', custom_message },
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

        results.sent++
      } catch {
        results.failed++
        results.errors.push(`Failed to process ${email}`)
      }
    }

    return Response.json({ results })
  } catch (error) {
    return handleApiError(error)
  }
}
