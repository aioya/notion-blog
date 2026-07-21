/**
 * Client-safe image URL mapper (no server-only imports).
 * Duplicated lightly from lib/notion.ts so NotionPage can run in the browser.
 */

const NOTION_HOST =
  process.env.NEXT_PUBLIC_NOTION_HOST || 'https://www.notion.so'

export function mapImageUrl(
  img: string | undefined | null,
  block: { id?: string; type?: string; value?: { id?: string } } | null | undefined,
  type: 'block' | 'collection' = 'block',
): string | undefined {
  if (!img) return undefined

  let ret = img.startsWith('/') ? `${NOTION_HOST}${img}` : img

  const hasConverted =
    ret.startsWith('https://www.notion.so/image') ||
    ret.includes('notion.site/images/page-cover/')

  const blockId = block?.id || block?.value?.id
  const blockType = block?.type

  const needConvert =
    !hasConverted &&
    (blockType === 'bookmark' ||
      ret.includes('secure.notion-static.com') ||
      ret.includes('prod-files-secure') ||
      ret.startsWith('attachment'))

  if (needConvert && blockId) {
    ret = `${NOTION_HOST}/image/${encodeURIComponent(ret)}?table=${type}&id=${blockId}`
  }

  return ret
}
