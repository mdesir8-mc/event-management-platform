import { z } from 'zod'

export const createEventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().max(10000).optional(),
    event_type: z.enum(['conference', 'workshop', 'meetup', 'expo', 'other']),
    start_date: z.string().datetime('Invalid start date'),
    end_date: z.string().datetime('Invalid end date'),
    timezone: z.string().min(1, 'Timezone is required'),
    location_type: z.enum(['in_person', 'virtual', 'hybrid']),
    venue_name: z.string().optional(),
    venue_address: z.string().optional(),
    max_attendees: z.number().positive().optional(),
    banner_image_url: z.string().url().optional().or(z.literal('')),
  })
  .refine(
    (data) => new Date(data.end_date) > new Date(data.start_date),
    { message: 'End date must be after start date', path: ['end_date'] }
  )

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(10000).optional(),
  event_type: z.enum(['conference', 'workshop', 'meetup', 'expo', 'other']).optional(),
  start_date: z.string().datetime('Invalid start date').optional(),
  end_date: z.string().datetime('Invalid end date').optional(),
  timezone: z.string().optional(),
  location_type: z.enum(['in_person', 'virtual', 'hybrid']).optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  max_attendees: z.number().positive().optional(),
  banner_image_url: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
})

export const eventQuerySchema = z.object({
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']).optional(),
  event_type: z.enum(['conference', 'workshop', 'meetup', 'expo', 'other']).optional(),
  organizer_id: z.string().uuid().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
})

export const searchEventsSchema = z.object({
  query: z.string().optional(),
  event_type: z.enum(['conference', 'workshop', 'meetup', 'expo', 'other']).optional(),
  location_type: z.enum(['in_person', 'virtual', 'hybrid']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
})

export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['published', 'cancelled'],
  published: ['ongoing', 'cancelled'],
  ongoing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
