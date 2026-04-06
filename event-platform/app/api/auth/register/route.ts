import { prisma } from '@/lib/db'
import { hashPassword, generateJWT } from '@/lib/auth'
import { registerSchema } from '@/lib/validation/auth'
import { handleApiError, ValidationError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function POST(request: Request) {
  try {
    checkRateLimit(getClientIp(request), 'auth/register', RATE_LIMITS.authRegister)

    const body = await request.json()
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const { email, password, full_name, role, organization_name } = result.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new ValidationError('An account with this email already exists')
    }

    const password_hash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, password_hash, full_name, role, organization_name },
      select: { id: true, email: true, full_name: true, role: true, organization_name: true },
    })

    const token = generateJWT(user.id, user.email)
    return Response.json({ user, token }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
