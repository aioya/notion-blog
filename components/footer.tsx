import { siteConfig } from '@/lib/config'

export function Footer() {
  const year = new Date().getFullYear()
  const since = siteConfig.since
  const range = year > since ? `${since}–${year}` : `${year}`

  return (
    <footer className="mx-auto mt-auto w-full max-w-2xl px-4 py-12 text-center text-sm text-zinc-400 sm:px-6">
      <p>
        © {range} {siteConfig.author}
        {siteConfig.bio ? ` · ${siteConfig.bio}` : ''}
      </p>
      <p className="mt-1">
        <a
          href="/rss.xml"
          className="hover:text-zinc-600 dark:hover:text-zinc-300"
        >
          RSS
        </a>
      </p>
    </footer>
  )
}
