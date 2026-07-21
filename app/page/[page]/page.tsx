import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PostList } from '@/components/post-list'
import { Pagination } from '@/components/pagination'
import { getSiteData } from '@/lib/notion'
import { pageNumbersFor, paginate } from '@/lib/pagination'
import { siteConfig } from '@/lib/config'

export const revalidate = 60

export async function generateStaticParams() {
  try {
    const { posts } = await getSiteData()
    return pageNumbersFor(posts).map((page) => ({ page: String(page) }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>
}): Promise<Metadata> {
  const { page: pageStr } = await params
  const page = Number(pageStr)
  return {
    title: `第 ${page} 页`,
    description: `${siteConfig.title} · 第 ${page} 页`,
  }
}

export default async function HomePaged({
  params,
}: {
  params: Promise<{ page: string }>
}) {
  const { page: pageStr } = await params
  const page = Number(pageStr)

  if (!Number.isFinite(page) || page < 1 || !Number.isInteger(page)) {
    notFound()
  }
  if (page === 1) redirect('/')

  const data = await getSiteData()
  const slice = paginate(data.posts, page)

  // Out of range (e.g. /page/999 with only 2 pages)
  if (page > slice.totalPages) notFound()

  return (
    <div>
      <section className="mb-6 border-b border-zinc-100 pb-6 dark:border-zinc-800">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2e405b] dark:text-zinc-100">
          {data.siteTitle || siteConfig.title}
        </h1>
        <p className="mt-2 text-xs text-zinc-400">
          共 {data.posts.length} 篇文章 · 第 {slice.page} / {slice.totalPages} 页
        </p>
      </section>

      <PostList posts={slice.items} />
      <Pagination
        page={slice.page}
        totalPages={slice.totalPages}
        total={slice.total}
        basePath=""
      />
    </div>
  )
}
