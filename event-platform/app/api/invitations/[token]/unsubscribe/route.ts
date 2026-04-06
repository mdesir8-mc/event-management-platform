import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const token_hash = hashToken(token)

  try {
    await prisma.invitation.updateMany({
      where: { token_hash },
      data: { status: 'declined' },
    })
  } catch {
    // Silently fail
  }

  return new Response(
    '<html><body><h1>Unsubscribed</h1><p>You have been unsubscribed from event invitations.</p></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  )
}
