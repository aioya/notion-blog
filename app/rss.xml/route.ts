import { Feed } from 'feed'
import { getSiteData } from '@/lib/notion'
import { siteConfig } from '@/lib/config'

export const revalidate = 60

export async function GET() {
  const data = await getSiteData()
  const siteUrl = siteConfig.url

  const feed = new Feed({
    title: data.siteTitle || siteConfig.title,
    description: data.siteDescription || siteConfig.description,
    id: siteUrl,
    link: siteUrl,
    language: siteConfig.lang,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, ${siteConfig.author}`,
    author: {
      name: siteConfig.author,
      link: siteUrl,
    },
  })

  for (const post of data.posts) {
    feed.addItem({
      title: post.title,
      id: `${siteUrl}${post.href}`,
      link: `${siteUrl}${post.href}`,
      description: post.summary || '',
      date: new Date(post.publishDate),
      category: post.tags.map((t) => ({ name: t })),
    })
  }

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, s-maxage=${siteConfig.revalidate}, stale-while-revalidate`,
    },
  })
}
