import type { MetadataRoute } from 'next'
import { getSiteData } from '@/lib/notion'
import { siteConfig } from '@/lib/config'

export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url
  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]

  try {
    const { posts, pages, tags, categories } = await getSiteData()

    for (const post of posts) {
      entries.push({
        url: `${base}${post.href}`,
        lastModified: new Date(post.lastEditedDate || post.publishDate),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    for (const page of pages) {
      entries.push({
        url: `${base}${page.href}`,
        lastModified: new Date(page.lastEditedDate || page.publishDate),
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }

    for (const tag of tags) {
      entries.push({
        url: `${base}/tag/${encodeURIComponent(tag)}`,
        changeFrequency: 'weekly',
        priority: 0.4,
      })
    }

    for (const cat of categories) {
      entries.push({
        url: `${base}/category/${encodeURIComponent(cat)}`,
        changeFrequency: 'weekly',
        priority: 0.4,
      })
    }
  } catch {
    // empty sitemap with homepage only
  }

  return entries
}
