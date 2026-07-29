import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getSiteData } from '@/lib/notion'
import { siteConfig } from '@/lib/config'
import './globals.css'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  let title = siteConfig.title
  let description = siteConfig.description
  try {
    const data = await getSiteData()
    title = data.siteTitle || title
    description = data.siteDescription || description
  } catch {
    // offline / notion unavailable during build metadata
  }

  return {
    title: {
      default: title,
      template: `%s · ${title}`,
    },
    description,
    metadataBase: new URL(siteConfig.url),
    authors: [{ name: siteConfig.author }],
    openGraph: {
      type: 'website',
      locale: siteConfig.lang,
      siteName: title,
      title,
      description,
      url: siteConfig.url,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      types: {
        'application/rss+xml': '/rss.xml',
      },
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  let title = siteConfig.title
  let pages: { title: string; href: string; slug: string }[] = []
  try {
    const data = await getSiteData()
    title = data.siteTitle || title
    pages = data.pages.map((p) => ({
      title: p.title,
      href: p.href,
      slug: p.slug,
    }))
  } catch {
    // ignore
  }

  return (
    <html lang={siteConfig.lang} className="h-full" suppressHydrationWarning>
      <body className="flex min-h-full flex-col antialiased">
        <Providers>
          <Header title={title} pages={pages} />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 sm:px-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
