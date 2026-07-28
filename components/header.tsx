import Link from 'next/link'
import { siteConfig } from '@/lib/config'
import { ThemeToggle } from './theme-toggle'

export function Header({
  title,
  pages = [],
}: {
  title?: string
  pages?: { title: string; href: string; slug: string }[]
}) {
  return (
    <header className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-8 sm:px-6">
      <div className="flex items-baseline gap-6">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-tight text-[#2e405b] dark:text-zinc-100"
        >
          {title || siteConfig.title}
        </Link>
        <nav className="hidden gap-4 text-sm text-zinc-500 sm:flex dark:text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            文章
          </Link>
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={p.href}
              target={/^https?:\/\//i.test(p.href) ? '_blank' : undefined}
              rel={
                /^https?:\/\//i.test(p.href)
                  ? 'noopener noreferrer'
                  : undefined
              }
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              {p.title}
            </Link>
          ))}
        </nav>
      </div>
      <ThemeToggle />
    </header>
  )
}
