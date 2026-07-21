import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { NotionPage } from '@/components/notion-page'
import { getAllPostSlugs, getPost, getSiteData } from '@/lib/notion'
import { siteConfig } from '@/lib/config'

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const slugs = await getAllPostSlugs()
    return slugs.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: post.title,
    description: post.summary || siteConfig.description,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: new Date(post.publishDate).toISOString(),
      modifiedTime: new Date(post.lastEditedDate).toISOString(),
      tags: post.tags,
      url: `${siteConfig.url}${post.href}`,
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  // related: same category or shared tags
  const { posts } = await getSiteData()
  const related = posts
    .filter((p) => p.id !== post.id)
    .filter(
      (p) =>
        (post.category && p.category === post.category) ||
        p.tags.some((t) => post.tags.includes(t)),
    )
    .slice(0, 4)

  return (
    <article>
      <header className="mb-8 border-b border-zinc-100 pb-8 dark:border-zinc-800">
        <Link
          href="/"
          className="text-xs text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          ← 返回
        </Link>
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#2e405b] dark:text-zinc-50">
          {post.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <time dateTime={new Date(post.publishDate).toISOString()}>
            {post.publishDay}
          </time>
          {post.category ? (
            <>
              <span>·</span>
              <Link
                href={`/category/${encodeURIComponent(post.category)}`}
                className="hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {post.category}
              </Link>
            </>
          ) : null}
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400"
            >
              #{tag}
            </Link>
          ))}
        </div>
        {post.summary ? (
          <p className="mt-4 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {post.summary}
          </p>
        ) : null}
      </header>

      <NotionPage recordMap={post.blockMap} />

      {related.length > 0 ? (
        <aside className="mt-16 border-t border-zinc-100 pt-8 dark:border-zinc-800">
          <h2 className="mb-4 text-sm font-medium text-zinc-500">相关文章</h2>
          <ul className="space-y-2">
            {related.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.href}
                  className="text-sm text-[#276077] hover:underline dark:text-zinc-200"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </article>
  )
}
