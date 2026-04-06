import { prisma } from '@/lib/db'

export async function GET() {
  const health = {
    status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
    database: 'connected' as 'connected' | 'error',
    email: 'operational' as 'operational' | 'error',
    storage: 'operational' as 'operational' | 'error',
    timestamp: new Date().toISOString(),
  }

  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    health.database = 'error'
    health.status = 'degraded'
  }

  if (!process.env.EMAIL_API_KEY) {
    health.email = 'error'
    health.status = 'degraded'
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    health.storage = 'error'
    health.status = 'degraded'
  }

  const statusCode = health.status === 'unhealthy' ? 503 : 200
  return Response.json(health, { status: statusCode })
}
