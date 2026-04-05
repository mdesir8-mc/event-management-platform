'use client'

type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
type InvitationStatus = 'pending' | 'sent' | 'opened' | 'accepted' | 'declined'
type SponsorTier = 'platinum' | 'gold' | 'silver' | 'bronze'

const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
}

const INVITATION_STATUS_COLORS: Record<InvitationStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  opened: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

const SPONSOR_TIER_COLORS: Record<SponsorTier, string> = {
  platinum: 'bg-purple-100 text-purple-700',
  gold: 'bg-yellow-100 text-yellow-700',
  silver: 'bg-gray-100 text-gray-700',
  bronze: 'bg-orange-100 text-orange-700',
}

interface StatusBadgeProps {
  status: EventStatus | InvitationStatus | SponsorTier
  type?: 'event' | 'invitation' | 'tier'
}

export default function StatusBadge({ status, type = 'event' }: StatusBadgeProps) {
  let colorClass = 'bg-gray-100 text-gray-700'

  if (type === 'event') colorClass = EVENT_STATUS_COLORS[status as EventStatus] ?? colorClass
  else if (type === 'invitation') colorClass = INVITATION_STATUS_COLORS[status as InvitationStatus] ?? colorClass
  else if (type === 'tier') colorClass = SPONSOR_TIER_COLORS[status as SponsorTier] ?? colorClass

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {status}
    </span>
  )
}
