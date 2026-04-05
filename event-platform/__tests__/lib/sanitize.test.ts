import { sanitizeHTML, sanitizeText, sanitizeUrl } from '@/lib/sanitize'

describe('sanitizeHTML', () => {
  it('escapes HTML tags', () => {
    expect(sanitizeHTML('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    )
  })

  it('escapes ampersands', () => {
    expect(sanitizeHTML('A & B')).toBe('A &amp; B')
  })

  it('escapes single quotes', () => {
    expect(sanitizeHTML("it's a test")).toContain('&#x27;')
  })
})

describe('sanitizeText', () => {
  it('trims whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello')
  })

  it('removes control characters', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld')
  })

  it('allows normal text', () => {
    expect(sanitizeText('Hello World 123')).toBe('Hello World 123')
  })
})

describe('sanitizeUrl', () => {
  it('blocks javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('')
  })

  it('blocks data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })
})
