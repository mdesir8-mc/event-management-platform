import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.EMAIL_API_KEY || '')

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

interface EventData {
  title: string
  start_date: Date
  end_date: Date
  venue_name?: string | null
  location_type: string
}

async function sendWithRetry(msg: sgMail.MailDataRequired, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await sgMail.send(msg)
      return
    } catch (error) {
      if (attempt === maxRetries) throw error
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
}

export async function sendInvitationEmail(
  to: string,
  name: string | undefined,
  event: EventData,
  token: string,
  customMessage?: string
): Promise<void> {
  const acceptUrl = `${APP_URL}/invite/${token}?response=accept`
  const declineUrl = `${APP_URL}/invite/${token}?response=decline`
  const eventUrl = `${APP_URL}/invite/${token}`
  const trackingUrl = `${APP_URL}/api/invitations/${token}/track-open`
  const unsubscribeUrl = `${APP_URL}/api/invitations/${token}/unsubscribe`

  const locationText =
    event.location_type === 'virtual'
      ? 'Virtual Event'
      : event.venue_name || 'Location TBD'

  const greeting = name ? `Hi ${name},` : 'Hello,'
  const customBlock = customMessage
    ? `<p style="font-style:italic;color:#555;">${customMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#333;">You're Invited!</h1>
  <p>${greeting}</p>
  <p>You're invited to <strong>${event.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong>!</p>
  <table style="background:#f5f5f5;padding:15px;border-radius:8px;width:100%;">
    <tr><td><strong>Date:</strong></td><td>${event.start_date.toLocaleDateString()} – ${event.end_date.toLocaleDateString()}</td></tr>
    <tr><td><strong>Location:</strong></td><td>${locationText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td></tr>
  </table>
  ${customBlock}
  <div style="margin:30px 0;text-align:center;">
    <a href="${acceptUrl}" style="background:#22c55e;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:5px;">Accept</a>
    &nbsp;
    <a href="${declineUrl}" style="background:#ef4444;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;margin:5px;">Decline</a>
  </div>
  <p><a href="${eventUrl}">View Event Details</a></p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
  <p style="font-size:12px;color:#999;"><a href="${unsubscribeUrl}">Unsubscribe from event invitations</a></p>
  <img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="">
</body>
</html>`

  await sendWithRetry({
    to,
    from: EMAIL_FROM,
    subject: `You're Invited to ${event.title}`,
    html,
    headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
  })
}

export async function sendConfirmationEmail(
  to: string,
  name: string | undefined,
  event: EventData,
  accepted: boolean
): Promise<void> {
  const greeting = name ? `Hi ${name},` : 'Hello,'
  const status = accepted ? 'accepted' : 'declined'
  const statusColor = accepted ? '#22c55e' : '#ef4444'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h1 style="color:#333;">RSVP Confirmation</h1>
  <p>${greeting}</p>
  <p>Your RSVP for <strong>${event.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong> has been recorded.</p>
  <p>Status: <span style="color:${statusColor};font-weight:bold;">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
  ${accepted ? `<p>We look forward to seeing you on ${event.start_date.toLocaleDateString()}!</p>` : '<p>We hope to see you at future events!</p>'}
</body>
</html>`

  await sendWithRetry({
    to,
    from: EMAIL_FROM,
    subject: `RSVP Confirmation: ${event.title}`,
    html,
  })
}
