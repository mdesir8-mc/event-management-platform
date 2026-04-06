import { hashPassword, verifyPassword, generateJWT, verifyJWT, generateInvitationToken, hashToken } from '@/lib/auth'

process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long'

describe('hashPassword', () => {
  it('produces a hash different from the plaintext', async () => {
    const hash = await hashPassword('TestPassword1')
    expect(hash).not.toBe('TestPassword1')
    expect(hash).toMatch(/^\$2[ab]\$/)
  })

  it('produces a different hash each time (salt)', async () => {
    const hash1 = await hashPassword('TestPassword1')
    const hash2 = await hashPassword('TestPassword1')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('returns true for correct password', async () => {
    const hash = await hashPassword('TestPassword1')
    const result = await verifyPassword('TestPassword1', hash)
    expect(result).toBe(true)
  })

  it('returns false for incorrect password', async () => {
    const hash = await hashPassword('TestPassword1')
    const result = await verifyPassword('WrongPassword1', hash)
    expect(result).toBe(false)
  })
})

describe('generateJWT / verifyJWT', () => {
  it('generates a valid JWT and verifies it', () => {
    const token = generateJWT('user-123', 'test@example.com')
    const payload = verifyJWT(token)
    expect(payload.sub).toBe('user-123')
    expect(payload.email).toBe('test@example.com')
  })

  it('throws for invalid token', () => {
    expect(() => verifyJWT('invalid.token.here')).toThrow()
  })

  it('throws a clear error when JWT_SECRET is missing', () => {
    const previousSecret = process.env.JWT_SECRET
    delete process.env.JWT_SECRET

    try {
      expect(() => generateJWT('user-123', 'test@example.com')).toThrow('JWT_SECRET is not configured')
      expect(() => verifyJWT('invalid.token.here')).toThrow('JWT_SECRET is not configured')
    } finally {
      process.env.JWT_SECRET = previousSecret
    }
  })
})

describe('generateInvitationToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateInvitationToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]+$/)
  })

  it('generates unique tokens', () => {
    const token1 = generateInvitationToken()
    const token2 = generateInvitationToken()
    expect(token1).not.toBe(token2)
  })
})

describe('hashToken', () => {
  it('produces a consistent SHA-256 hash', () => {
    const token = 'abc123'
    const hash1 = hashToken(token)
    const hash2 = hashToken(token)
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
  })

  it('produces different hashes for different tokens', () => {
    expect(hashToken('token1')).not.toBe(hashToken('token2'))
  })
})
