import { siteConfig } from './config'
import type { Post } from './types'

export interface PageSlice<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasPrev: boolean
  hasNext: boolean
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize = siteConfig.postsPerPage,
): PageSlice<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Number.isFinite(page)
    ? Math.min(Math.max(1, Math.floor(page)), totalPages)
    : 1
  const start = (safePage - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  }
}

export function pageHref(page: number, basePath = ''): string {
  if (page <= 1) return basePath || '/'
  if (!basePath || basePath === '/') return `/page/${page}`
  return `${basePath}/page/${page}`
}

/** Generate static page numbers for a list of posts (2..N). */
export function pageNumbersFor(posts: Post[], pageSize = siteConfig.postsPerPage): number[] {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize))
  if (totalPages <= 1) return []
  return Array.from({ length: totalPages - 1 }, (_, i) => i + 2)
}
