import { shouldIncludeAllOrganizerStatuses } from '@/lib/event-visibility'

describe('shouldIncludeAllOrganizerStatuses', () => {
  it('returns true when the organizer requests their own events', () => {
    expect(
      shouldIncludeAllOrganizerStatuses('organizer-1', {
        id: 'organizer-1',
        email: 'organizer@example.com',
        role: 'organizer',
        full_name: 'Organizer One',
        organization_name: 'Acme Events',
      })
    ).toBe(true)
  })

  it('returns true for admins viewing another organizer\'s events', () => {
    expect(
      shouldIncludeAllOrganizerStatuses('organizer-1', {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
        full_name: 'Admin User',
        organization_name: null,
      })
    ).toBe(true)
  })

  it('returns false without an authenticated matching user', () => {
    expect(shouldIncludeAllOrganizerStatuses('organizer-1', null)).toBe(false)
    expect(
      shouldIncludeAllOrganizerStatuses('organizer-1', {
        id: 'organizer-2',
        email: 'other@example.com',
        role: 'organizer',
        full_name: 'Organizer Two',
        organization_name: 'Other Org',
      })
    ).toBe(false)
  })
})
