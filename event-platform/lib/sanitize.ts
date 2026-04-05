/**
 * Sanitize HTML input to prevent XSS attacks.
 * Uses a server-safe approach by stripping all HTML tags.
 */
export function sanitizeHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize plain text by escaping special characters.
 */
export function sanitizeText(input: string): string {
  return input.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Sanitize a URL to prevent javascript: protocol injection.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim().toLowerCase()
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) {
    return ''
  }
  return url.trim()
}
