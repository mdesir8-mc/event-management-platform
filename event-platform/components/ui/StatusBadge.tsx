'use client'

type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
type InvitationStatus = 'pending' | 'sent' | 'opened' | 'accepted' | 'declined'
type SponsorTier = 'platinum' | 'gold' | 'silver' | 'bronze'

const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-stone-100 text-stone-600',
  published: 'bg-amber-100 text-amber-800',
  ongoing: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-stone-200 text-stone-700',
  cancelled: 'bg-red-100 text-red-700',
}

const INVITATION_STATUS_COLORS: Record<InvitationStatus, string> = {
  pending: 'bg-stone-100 text-stone-600',
  sent: 'bg-amber-100 text-amber-800',
  opened: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  declined: 'bg-red-100 text-red-700',
}

const SPONSOR_TIER_COLORS: Record<SponsorTier, string> = {
  platinum: 'bg-stone-200 text-stone-700',
  gold: 'bg-amber-100 text-amber-700',
  silver: 'bg-stone-100 text-stone-600',
  bronze: 'bg-orange-100 text-orange-700',
}

interface StatusBadgeProps {
  status: EventStatus | InvitationStatus | SponsorTier
  type?: 'event' | 'invitation' | 'tier'
}

export default function StatusBadge({ status, type = 'event' }: StatusBadgeProps) {
  let colorClass = 'bg-stone-100 text-stone-600'

  if (type === 'event') colorClass = EVENT_STATUS_COLORS[status as EventStatus] ?? colorClass
  else if (type === 'invitation') colorClass = INVITATION_STATUS_COLORS[status as InvitationStatus] ?? colorClass
  else if (type === 'tier') colorClass = SPONSOR_TIER_COLORS[status as SponsorTier] ?? colorClass

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {status}
    </span>
  )
}
