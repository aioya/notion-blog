'use client'

import type { MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function ArticleBackLink({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter()

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    event.preventDefault()

    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className="text-xs text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
    >
      ← 返回
    </Link>
  )
}
