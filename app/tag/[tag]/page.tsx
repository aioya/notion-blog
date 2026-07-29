import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostList } from '@/components/post-list'
import { Pagination } from '@/components/pagination'
import { getSiteData } from '@/lib/notion'
import { paginate } from '@/lib/pagination'

export const revalidate = 3600

export async function generateStaticParams() {
  try {
    const { tags } = await getSiteData()
    return tags.map((tag) => ({ tag }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>
}): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `#${decoded}`,
    description: `标签「${decoded}」下的文章`,
  }
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>
}) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  const { posts, tags } = await getSiteData()

  if (!tags.includes(decoded)) notFound()

  const filtered = posts.filter((p) => p.tags.includes(decoded))
  const slice = paginate(filtered, 1)
  const basePath = `/tag/${encodeURIComponent(decoded)}`

  return (
    <div>
      <header className="mb-8 border-b border-zinc-100 pb-6 dark:border-zinc-800">
        <Link
          href="/"
          className="text-xs text-zinc-400 transition hover:text-zinc-600"
        >
          ← 返回
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-semibold">#{decoded}</h1>
        <p className="mt-1 text-sm text-zinc-400">共 {filtered.length} 篇文章</p>
      </header>
      <PostList posts={slice.items} emptyText="该标签下暂无文章" />
      <Pagination
        page={slice.page}
        totalPages={slice.totalPages}
        total={slice.total}
        basePath={basePath}
      />
    </div>
  )
}
