import Link from 'next/link'
import { pageHref } from '@/lib/pagination'

export function Pagination({
  page,
  totalPages,
  total,
  basePath = '',
}: {
  page: number
  totalPages: number
  total: number
  /** '' or '/' for home; e.g. '/tag/前端' for tag lists */
  basePath?: string
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-10 text-center text-xs text-zinc-400">
        共 {total} 篇
      </p>
    )
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const base = basePath === '/' ? '' : basePath

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-3 border-t border-zinc-100 pt-8 dark:border-zinc-800"
      aria-label="分页"
    >
      <p className="text-xs text-zinc-400">
        共 {total} 篇 · 第 {page} / {totalPages} 页
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 ? (
          <Link
            href={pageHref(page - 1, base)}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            上一页
          </Link>
        ) : (
          <span className="rounded-md px-3 py-1.5 text-sm text-zinc-300 dark:text-zinc-600">
            上一页
          </span>
        )}

        {pages.map((p) => {
          const active = p === page
          return (
            <Link
              key={p}
              href={pageHref(p, base)}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'rounded-md bg-[#276077] px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'rounded-md px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }
            >
              {p}
            </Link>
          )
        })}

        {page < totalPages ? (
          <Link
            href={pageHref(page + 1, base)}
            className="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            下一页
          </Link>
        ) : (
          <span className="rounded-md px-3 py-1.5 text-sm text-zinc-300 dark:text-zinc-600">
            下一页
          </span>
        )}
      </div>
    </nav>
  )
}
