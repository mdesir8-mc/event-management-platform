import { formatDateTimeInput, normalizeDateTimeInput } from '@/lib/datetime'

describe('normalizeDateTimeInput', () => {
  it('converts datetime-local values using the selected event timezone', () => {
    expect(normalizeDateTimeInput('2027-01-01T10:00', 'America/New_York')).toBe('2027-01-01T15:00:00.000Z')
    expect(normalizeDateTimeInput('2027-06-01T10:00', 'Europe/London')).toBe('2027-06-01T09:00:00.000Z')
  })

  it('returns ISO datetime strings unchanged after parsing', () => {
    expect(normalizeDateTimeInput('2027-01-01T10:00:00.000Z', 'UTC')).toBe('2027-01-01T10:00:00.000Z')
  })

  it('leaves invalid values untouched', () => {
    expect(normalizeDateTimeInput('not-a-date', 'UTC')).toBe('not-a-date')
  })
})

describe('formatDateTimeInput', () => {
  it('formats stored ISO timestamps in the selected event timezone', () => {
    expect(formatDateTimeInput('2027-01-01T15:00:00.000Z', 'America/New_York')).toBe('2027-01-01T10:00')
    expect(formatDateTimeInput('2027-06-01T09:00:00.000Z', 'Europe/London')).toBe('2027-06-01T10:00')
  })

  it('leaves invalid values untouched', () => {
    expect(formatDateTimeInput('not-a-date', 'UTC')).toBe('not-a-date')
  })
})
