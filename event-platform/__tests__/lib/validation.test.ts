import { registerSchema, loginSchema } from '@/lib/validation/auth'
import { createEventSchema } from '@/lib/validation/events'
import { sendInvitationSchema, bulkInvitationSchema } from '@/lib/validation/invitations'
import { createSponsorSchema, createLeadSchema } from '@/lib/validation/sponsors'

describe('registerSchema', () => {
  it('validates a valid registration', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Password1',
      full_name: 'Test User',
      role: 'organizer',
    })
    expect(result.success).toBe(true)
  })

  it('rejects weak password (no uppercase)', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password1',
      full_name: 'Test User',
      role: 'organizer',
    })
    expect(result.success).toBe(false)
  })

  it('rejects weak password (no number)', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Password',
      full_name: 'Test User',
      role: 'organizer',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'Password1',
      full_name: 'Test User',
      role: 'organizer',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Password1',
      full_name: 'Test User',
      role: 'superuser',
    })
    expect(result.success).toBe(false)
  })
})

describe('createEventSchema', () => {
  const validEvent = {
    title: 'Test Event 2026',
    event_type: 'conference',
    start_date: '2027-01-01T10:00:00.000Z',
    end_date: '2027-01-02T18:00:00.000Z',
    timezone: 'UTC',
    location_type: 'in_person',
  }

  it('validates a valid event', () => {
    const result = createEventSchema.safeParse(validEvent)
    expect(result.success).toBe(true)
  })

  it('rejects end_date before start_date', () => {
    const result = createEventSchema.safeParse({
      ...validEvent,
      end_date: '2026-12-31T10:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects title shorter than 3 chars', () => {
    const result = createEventSchema.safeParse({ ...validEvent, title: 'AB' })
    expect(result.success).toBe(false)
  })
})

describe('sendInvitationSchema', () => {
  it('validates a valid invitation', () => {
    const result = sendInvitationSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = sendInvitationSchema.safeParse({ email: 'not-valid' })
    expect(result.success).toBe(false)
  })
})

describe('bulkInvitationSchema', () => {
  it('rejects arrays over 1000 items', () => {
    const items = Array.from({ length: 1001 }, (_, i) => ({ email: `user${i}@example.com` }))
    const result = bulkInvitationSchema.safeParse(items)
    expect(result.success).toBe(false)
  })
})

describe('createSponsorSchema', () => {
  it('validates a valid sponsor', () => {
    const result = createSponsorSchema.safeParse({ company_name: 'Acme Corp', tier: 'gold' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid tier', () => {
    const result = createSponsorSchema.safeParse({ company_name: 'Acme Corp', tier: 'diamond' })
    expect(result.success).toBe(false)
  })
})

describe('createLeadSchema', () => {
  it('validates a valid lead', () => {
    const result = createLeadSchema.safeParse({
      attendee_name: 'Jane Doe',
      attendee_email: 'jane@example.com',
      interaction_type: 'booth_visit',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid interaction type', () => {
    const result = createLeadSchema.safeParse({
      attendee_name: 'Jane Doe',
      attendee_email: 'jane@example.com',
      interaction_type: 'phone_call',
    })
    expect(result.success).toBe(false)
  })
})
