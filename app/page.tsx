import { PostList } from '@/components/post-list'
import { Pagination } from '@/components/pagination'
import { getSiteData } from '@/lib/notion'
import { paginate } from '@/lib/pagination'
import { siteConfig } from '@/lib/config'

export const revalidate = 60

export default async function HomePage() {
  const data = await getSiteData()
  const slice = paginate(data.posts, 1)

  return (
    <div>
      <section className="mb-8 border-b border-zinc-100 pb-8 dark:border-zinc-800">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#2e405b] dark:text-zinc-100">
          {data.siteTitle || siteConfig.title}
        </h1>
        {(data.siteDescription || siteConfig.description) && (
          <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {data.siteDescription || siteConfig.description}
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          共 {data.posts.length} 篇文章
        </p>
        {(data.tags.length > 0 || data.categories.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {data.categories.map((cat) => (
              <a
                key={cat}
                href={`/category/${encodeURIComponent(cat)}`}
                className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {cat}
              </a>
            ))}
            {data.tags.map((tag) => (
              <a
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-zinc-500 transition hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400"
              >
                #{tag}
              </a>
            ))}
          </div>
        )}
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
