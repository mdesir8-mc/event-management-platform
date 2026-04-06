import { requireAuth } from '@/lib/middleware/auth'
import { handleApiError } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request)
    return Response.json({ user })
  } catch (error) {
    return handleApiError(error)
  }
}
