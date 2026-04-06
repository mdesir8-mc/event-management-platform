import { prisma } from '@/lib/db'

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title)
  let slug = base
  let counter = 1

  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug } })
    if (!existing) return slug
    slug = `${base}-${counter++}`
  }
}
