import { prisma } from '@/lib/db'
import { hashToken } from '@/lib/auth'

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const token_hash = hashToken(token)

  try {
    await prisma.invitation.updateMany({
      where: { token_hash, opened_at: null },
      data: { opened_at: new Date(), status: 'opened' },
    })
  } catch {
    // Silently fail - tracking is best-effort
  }

  return new Response(TRACKING_PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
