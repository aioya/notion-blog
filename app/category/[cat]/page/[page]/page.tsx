import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { PostList } from '@/components/post-list'
import { Pagination } from '@/components/pagination'
import { getSiteData } from '@/lib/notion'
import { pageNumbersFor, paginate } from '@/lib/pagination'

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const { posts, categories } = await getSiteData()
    const params: { cat: string; page: string }[] = []
    for (const cat of categories) {
      const filtered = posts.filter((p) => p.category === cat)
      for (const page of pageNumbersFor(filtered)) {
        params.push({ cat, page: String(page) })
      }
    }
    return params
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cat: string; page: string }>
}): Promise<Metadata> {
  const { cat, page } = await params
  const decoded = decodeURIComponent(cat)
  return {
    title: `${decoded} · 第 ${page} 页`,
  }
}

export default async function CategoryPaged({
  params,
}: {
  params: Promise<{ cat: string; page: string }>
}) {
  const { cat, page: pageStr } = await params
  const decoded = decodeURIComponent(cat)
  const page = Number(pageStr)

  if (!Number.isFinite(page) || page < 1 || !Number.isInteger(page)) {
    notFound()
  }

  const { posts, categories } = await getSiteData()
  if (!categories.includes(decoded)) notFound()

  const basePath = `/category/${encodeURIComponent(decoded)}`
  if (page === 1) redirect(basePath)

  const filtered = posts.filter((p) => p.category === decoded)
  const slice = paginate(filtered, page)
  if (page > slice.totalPages) notFound()

  return (
    <div>
      <header className="mb-8 border-b border-zinc-100 pb-6 dark:border-zinc-800">
        <Link
          href="/"
          className="text-xs text-zinc-400 transition hover:text-zinc-600"
        >
          ← 返回
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-semibold">{decoded}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          共 {filtered.length} 篇 · 第 {slice.page}/{slice.totalPages} 页
        </p>
      </header>
      <PostList posts={slice.items} emptyText="该分类下暂无文章" />
      <Pagination
        page={slice.page}
        totalPages={slice.totalPages}
        total={slice.total}
        basePath={basePath}
      />
    </div>
  )
}
