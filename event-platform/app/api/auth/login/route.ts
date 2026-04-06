import { prisma } from '@/lib/db'
import { verifyPassword, generateJWT } from '@/lib/auth'
import { loginSchema } from '@/lib/validation/auth'
import { handleApiError, ValidationError, UnauthorizedError } from '@/lib/errors'
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/middleware/rateLimit'

export async function POST(request: Request) {
  try {
    checkRateLimit(getClientIp(request), 'auth/login', RATE_LIMITS.authLogin)

    const body = await request.json()
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      throw new ValidationError(result.error.issues[0].message)
    }

    const { email, password } = result.data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const token = generateJWT(user.id, user.email)
    const { password_hash: _, ...userWithoutPassword } = user

    return Response.json({ user: userWithoutPassword, token })
  } catch (error) {
    return handleApiError(error)
  }
}
