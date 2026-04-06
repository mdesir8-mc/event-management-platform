import { z } from 'zod'

export const createSponsorSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters').max(200),
  tier: z.enum(['platinum', 'gold', 'silver', 'bronze']),
  logo_url: z.string().url().optional().or(z.literal('')),
  website_url: z.string().url().optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  booth_number: z.string().max(50).optional(),
  user_id: z.string().uuid().optional(),
})

export const updateSponsorSchema = createSponsorSchema.partial()

export const createLeadSchema = z.object({
  attendee_name: z.string().min(2, 'Attendee name must be at least 2 characters'),
  attendee_email: z.string().email('Invalid email address'),
  interaction_type: z.enum(['booth_visit', 'material_download', 'meeting_request']),
  notes: z.string().max(1000).optional(),
})

export const leadsQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
})

export type CreateSponsorInput = z.infer<typeof createSponsorSchema>
export type CreateLeadInput = z.infer<typeof createLeadSchema>
