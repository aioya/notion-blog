'use client'

import dynamic from 'next/dynamic'
import { NotionRenderer } from 'react-notion-x'
import type { ExtendedRecordMap } from 'notion-types'
import { mapImageUrl } from '@/lib/notion-client'
import { siteConfig } from '@/lib/config'

import 'react-notion-x/styles.css'
import 'katex/dist/katex.min.css'
import 'prismjs/themes/prism-tomorrow.css'

async function loadPrismLanguages() {
  // Side-effect imports — types declared in types/prismjs-components.d.ts
  await Promise.all([
    import('prismjs/components/prism-markup-templating.js'),
    import('prismjs/components/prism-markup.js'),
    import('prismjs/components/prism-bash.js'),
    import('prismjs/components/prism-c.js'),
    import('prismjs/components/prism-cpp.js'),
    import('prismjs/components/prism-csharp.js'),
    import('prismjs/components/prism-css.js'),
    import('prismjs/components/prism-docker.js'),
    import('prismjs/components/prism-java.js'),
    import('prismjs/components/prism-javascript.js'),
    import('prismjs/components/prism-jsx.js'),
    import('prismjs/components/prism-typescript.js'),
    import('prismjs/components/prism-tsx.js'),
    import('prismjs/components/prism-json.js'),
    import('prismjs/components/prism-markdown.js'),
    import('prismjs/components/prism-python.js'),
    import('prismjs/components/prism-sql.js'),
    import('prismjs/components/prism-yaml.js'),
    import('prismjs/components/prism-go.js'),
    import('prismjs/components/prism-rust.js'),
  ]).catch(() => {})
}

const Code = dynamic(() =>
  import('react-notion-x/third-party/code').then(async (m) => {
    await loadPrismLanguages()
    return m.Code
  }),
)

const Collection = dynamic(() =>
  import('react-notion-x/third-party/collection').then((m) => m.Collection),
)

const Equation = dynamic(() =>
  import('react-notion-x/third-party/equation').then((m) => m.Equation),
)

const Modal = dynamic(
  () => import('react-notion-x/third-party/modal').then((m) => m.Modal),
  { ssr: false },
)

function mapPageUrl(pageId: string) {
  return `https://www.notion.so/${pageId.replace(/-/g, '')}`
}

export function NotionPage({
  recordMap,
  className,
}: {
  recordMap: ExtendedRecordMap
  className?: string
}) {
  return (
    <div
      id="notion-article"
      className={`notion-page-wrapper overflow-hidden ${className || ''}`}
    >
      <NotionRenderer
        recordMap={recordMap}
        fullPage={false}
        darkMode={false}
        disableHeader
        mapPageUrl={mapPageUrl}
        mapImageUrl={(url, block) =>
          mapImageUrl(url, block as { id?: string; type?: string }) || url
        }
        components={{
          Code,
          Collection,
          Equation,
          Modal,
        }}
      />
      <span className="sr-only" data-post-prefix={siteConfig.postUrlPrefix} />
    </div>
  )
}
