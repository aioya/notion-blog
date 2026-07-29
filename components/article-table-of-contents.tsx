import type { TableOfContentsEntry } from 'notion-utils'

function TableOfContentsLinks({
  items,
}: {
  items: TableOfContentsEntry[]
}) {
  return (
    <nav aria-label="文章目录" className="max-h-[calc(100vh-8rem)] overflow-y-auto">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id.replace(/-/g, '')}`}
              className="block truncate rounded px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-[#276077] focus-visible:outline-none dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              style={{ paddingLeft: `${item.indentLevel * 12 + 8}px` }}
              title={item.text}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function ArticleTableOfContents({
  items,
}: {
  items: TableOfContentsEntry[]
}) {
  if (!items.length) return null

  return (
    <>
      <aside className="absolute top-0 right-full mr-10 hidden h-full w-56 xl:block">
        <div className="sticky top-8">
          <p className="mb-2 px-2 text-xs font-medium tracking-wide text-zinc-400">
            文章目录
          </p>
          <TableOfContentsLinks items={items} />
        </div>
      </aside>

      <details className="group mb-6 rounded-lg border border-zinc-200 bg-white/80 xl:hidden dark:border-zinc-800 dark:bg-zinc-900/80">
        <summary className="flex min-h-11 cursor-pointer touch-manipulation list-none items-center justify-between px-4 py-2.5 text-sm font-medium text-zinc-600 focus-visible:ring-2 focus-visible:ring-[#276077] focus-visible:outline-none dark:text-zinc-300 [&::-webkit-details-marker]:hidden">
          文章目录
          <span
            aria-hidden="true"
            className="text-zinc-400 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          >
            ▾
          </span>
        </summary>
        <div className="border-t border-zinc-200 px-2 py-2 dark:border-zinc-800">
          <TableOfContentsLinks items={items} />
        </div>
      </details>
    </>
  )
}
