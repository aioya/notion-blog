import type { MetadataRoute } from 'next'
import { getSiteData } from '@/lib/notion'
import { siteConfig } from '@/lib/config'
import { pageNumbersFor } from '@/lib/pagination'

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

    for (const pageNum of pageNumbersFor(posts)) {
      entries.push({
        url: `${base}/page/${pageNum}`,
        changeFrequency: 'daily',
        priority: 0.7,
      })
    }

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
      const tagPath = `/tag/${encodeURIComponent(tag)}`
      entries.push({
        url: `${base}${tagPath}`,
        changeFrequency: 'weekly',
        priority: 0.4,
      })
      const filtered = posts.filter((p) => p.tags.includes(tag))
      for (const pageNum of pageNumbersFor(filtered)) {
        entries.push({
          url: `${base}${tagPath}/page/${pageNum}`,
          changeFrequency: 'weekly',
          priority: 0.3,
        })
      }
    }

    for (const cat of categories) {
      const catPath = `/category/${encodeURIComponent(cat)}`
      entries.push({
        url: `${base}${catPath}`,
        changeFrequency: 'weekly',
        priority: 0.4,
      })
      const filtered = posts.filter((p) => p.category === cat)
      for (const pageNum of pageNumbersFor(filtered)) {
        entries.push({
          url: `${base}${catPath}/page/${pageNum}`,
          changeFrequency: 'weekly',
          priority: 0.3,
        })
      }
    }
  } catch {
    // empty sitemap with homepage only
  }

  return entries
}
