import { z } from 'zod'

export const sendInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().optional(),
  custom_message: z.string().max(1000).optional(),
})

export const bulkInvitationSchema = z.array(sendInvitationSchema).max(1000, 'Maximum 1000 invitations per upload')

export const respondSchema = z.object({
  response: z.enum(['accepted', 'declined']),
})

export type SendInvitationInput = z.infer<typeof sendInvitationSchema>
export type RespondInput = z.infer<typeof respondSchema>
