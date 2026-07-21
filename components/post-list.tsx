import type { Post } from '@/lib/types'
import { PostCard } from './post-card'

export function PostList({
  posts,
  emptyText = '暂无文章',
}: {
  posts: Post[]
  emptyText?: string
}) {
  if (!posts.length) {
    return (
      <p className="py-16 text-center text-sm text-zinc-400">{emptyText}</p>
    )
  }

  return (
    <div className="divide-y-0">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
