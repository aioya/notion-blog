import Link from 'next/link'
import type { Post } from '@/lib/types'

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="group border-b border-zinc-100 py-6 last:border-0 dark:border-zinc-800">
      <Link href={post.href} className="block">
        <h2 className="blog-item-title text-lg font-medium text-[#276077] transition group-hover:opacity-80 dark:text-zinc-100">
          {post.icon ? <span className="mr-2">{post.icon}</span> : null}
          {post.title}
        </h2>
        {post.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {post.summary}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          <time dateTime={new Date(post.publishDate).toISOString()}>
            {post.publishDay}
          </time>
          {post.category ? (
            <>
              <span>·</span>
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                {post.category}
              </span>
            </>
          ) : null}
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded bg-zinc-50 px-1.5 py-0.5 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </Link>
    </article>
  )
}
