import { sendInvitationEmail } from '@/lib/email'
import { prisma } from '@/lib/db'

interface EmailJob {
  invitationId: string
  to: string
  name?: string
  eventData: {
    title: string
    start_date: Date
    end_date: Date
    venue_name?: string | null
    location_type: string
  }
  token: string
  customMessage?: string
  attempts: number
}

const queue: EmailJob[] = []
let processing = false

export function enqueueInvitationEmail(job: Omit<EmailJob, 'attempts'>): void {
  queue.push({ ...job, attempts: 0 })
  if (!processing) processQueue()
}

async function processQueue(): Promise<void> {
  if (processing || queue.length === 0) return
  processing = true

  while (queue.length > 0) {
    const job = queue.shift()!
    try {
      await sendInvitationEmail(job.to, job.name, job.eventData, job.token, job.customMessage)
      await prisma.invitation.update({
        where: { id: job.invitationId },
        data: { status: 'sent', sent_at: new Date() },
      })
    } catch (error) {
      job.attempts++
      if (job.attempts < 3) {
        // Re-queue with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000
        setTimeout(() => {
          queue.push(job)
          if (!processing) processQueue()
        }, delay)
      } else {
        console.error(`Failed to send invitation email after 3 attempts:`, error)
      }
    }
  }

  processing = false
}
