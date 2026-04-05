import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET!
const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateJWT(userId: string, email: string): string {
  return jwt.sign(
    { sub: userId, email },
    JWT_SECRET,
    { expiresIn: '1h' }
  )
}

export function verifyJWT(token: string): { sub: string; email: string } {
  const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string }
  return payload
}

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
