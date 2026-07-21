import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-serif text-4xl font-semibold text-zinc-700 dark:text-zinc-200">
        404
      </h1>
      <p className="mt-3 text-sm text-zinc-400">页面不存在</p>
      <Link
        href="/"
        className="mt-8 text-sm text-[#276077] hover:underline dark:text-zinc-300"
      >
        返回首页
      </Link>
    </div>
  )
}
