import 'server-only'

import { cache } from 'react'
import { NotionAPI } from 'notion-client'
import { getDateValue, getTextContent, idToUuid } from 'notion-utils'
import type { ExtendedRecordMap } from 'notion-types'

import { siteConfig } from './config'
import type { Post, SiteData } from './types'

// ── Notion API singleton ──────────────────────────────────────────────

let notionClient: NotionAPI | null = null

function getNotion(): NotionAPI {
  if (!notionClient) {
    // Public page reads work without auth. The syncRecordValues→Main
    // rename is handled inside recent notion-client builds for getPage.
    notionClient = new NotionAPI({
      apiBaseUrl: siteConfig.notionApiBase,
      userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  }
  return notionClient
}

// ── ID helpers ────────────────────────────────────────────────────────

function toUuid(id: string): string {
  const compact = id.replace(/-/g, '')
  if (!/^[0-9a-fA-F]{32}$/.test(compact)) return id
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join('-')
}

function idCandidates(id: string | null | undefined): string[] {
  if (!id) return []
  const set = new Set<string>([id, id.replace(/-/g, ''), toUuid(id)])
  try {
    set.add(idToUuid(id))
  } catch {
    // notion-utils uuidToId(null) can throw — guard at call sites
  }
  return [...set]
}

function getRecordById<T>(
  record: Record<string, T> | undefined | null,
  id: string | null | undefined,
): T | null {
  if (!record || !id) return null
  for (const candidate of idCandidates(id)) {
    if (record[candidate]) return record[candidate]
  }
  return null
}

// ── Block / collection normalizers (from NotionNext) ──────────────────

function unwrapValue(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj
  const o = obj as Record<string, unknown>

  // { spaceId, value: { value: { id, type | schema }, role } }
  const inner = o.value as Record<string, unknown> | undefined
  if (inner?.value && typeof inner.value === 'object') {
    const deep = inner.value as Record<string, unknown>
    if (
      deep.id &&
      (inner.role !== undefined || deep.type || deep.schema)
    ) {
      return deep
    }
  }

  // { value: { id, type }, role }
  if (inner?.id && o.role !== undefined) return inner

  // { value: { id, type } } or collection with schema
  if (inner?.id || inner?.schema) return inner

  return inner ?? obj
}

function adapterBlockMap(
  blockMap: ExtendedRecordMap,
): ExtendedRecordMap {
  const cleanedBlocks: Record<string, { value: unknown }> = {}
  const cleanedCollection: Record<string, { value: unknown }> = {}

  for (const [id, block] of Object.entries(blockMap.block || {})) {
    cleanedBlocks[id] = { value: unwrapValue(block) }
  }
  for (const [id, collection] of Object.entries(
    blockMap.collection || {},
  )) {
    cleanedCollection[id] = { value: unwrapValue(collection) }
  }

  return {
    ...blockMap,
    block: cleanedBlocks as ExtendedRecordMap['block'],
    collection: cleanedCollection as ExtendedRecordMap['collection'],
  }
}

function normalizeCollection(collection: unknown): Record<string, unknown> {
  let current: unknown = collection
  for (let i = 0; i < 3; i++) {
    if (!current || typeof current !== 'object') break
    const c = current as Record<string, unknown>
    if (c.schema) return c
    if (c.value) {
      current = c.value
      continue
    }
    break
  }
  return (current as Record<string, unknown>) ?? {}
}

function normalizePageBlock(
  blockItem: unknown,
): Record<string, unknown> | null {
  if (!blockItem) return null
  let current: unknown = blockItem
  for (let i = 0; i < 5; i++) {
    if (!current || typeof current !== 'object') return null
    const c = current as Record<string, unknown>
    if (
      (c.type === 'collection_view_page' || c.type === 'collection_view') &&
      c.collection_id
    ) {
      return c
    }
    if (c.type || c.properties) return c
    if (c.value) {
      current = c.value
      continue
    }
    break
  }
  return null
}

function normalizeMetadata(
  block: ExtendedRecordMap['block'],
  pageId: string,
): Record<string, unknown> | null {
  const raw = block?.[pageId] as { value?: unknown } | undefined
  const rawValue = raw?.value as Record<string, unknown> | undefined
  if (!rawValue) return null
  return (rawValue.type ? rawValue : (rawValue.value as Record<string, unknown>)) ?? null
}

// ── Page ID extraction ────────────────────────────────────────────────

function collectBlockIdsFromViewData(viewData: unknown): string[] {
  if (!viewData || typeof viewData !== 'object') return []
  const vd = viewData as Record<string, unknown>
  const group = vd.collection_group_results as { blockIds?: string[] } | undefined
  const results = vd.results as { blockIds?: string[] } | undefined
  const ids = [
    ...(group?.blockIds || []),
    ...(results?.blockIds || []),
    ...((vd.blockIds as string[] | undefined) || []),
  ]
  return ids.filter(Boolean)
}

/**
 * Collect row IDs from collection views.
 * Prefer the configured view (notionIndex), then union remaining views so
 * filtered views don't hide published posts that only appear elsewhere.
 */
function getAllPageIds(
  collectionQuery: ExtendedRecordMap['collection_query'] | undefined,
  collectionId: string | null,
  collectionView: ExtendedRecordMap['collection_view'] | undefined,
  viewIds: string[] | undefined,
): string[] {
  const pageSet = new Set<string>()
  const preferredViewId = viewIds?.[siteConfig.notionIndex] ?? viewIds?.[0]

  const viewQuery = getRecordById(
    collectionQuery as Record<string, unknown> | undefined,
    collectionId,
  ) as Record<string, unknown> | null

  if (viewQuery) {
    // 1) Preferred view first (keeps its relative order when we iterate later)
    if (preferredViewId) {
      const selected = getRecordById(
        viewQuery as Record<string, unknown>,
        preferredViewId,
      )
      collectBlockIdsFromViewData(selected).forEach((id) => pageSet.add(id))
    }

    // 2) Union all views so nothing is dropped by a single filtered view
    for (const viewData of Object.values(viewQuery)) {
      collectBlockIdsFromViewData(viewData).forEach((id) => pageSet.add(id))
    }
  }

  // Fallback: page_sort when no query results
  if (pageSet.size === 0 && collectionView && preferredViewId) {
    const selectedView = getRecordById(
      collectionView as unknown as Record<string, unknown>,
      preferredViewId,
    ) as {
      value?: { value?: { page_sort?: string[] }; page_sort?: string[] }
    } | null
    const pageSort =
      selectedView?.value?.value?.page_sort || selectedView?.value?.page_sort
    if (Array.isArray(pageSort)) {
      pageSort.forEach((id) => pageSet.add(id))
    }
  }

  return [...pageSet]
}

// ── Image mapping ─────────────────────────────────────────────────────

export function mapImageUrl(
  img: string | undefined | null,
  block: { id?: string; type?: string } | null | undefined,
  type: 'block' | 'collection' = 'block',
): string | undefined {
  if (!img) return undefined

  let ret = img.startsWith('/') ? `${siteConfig.notionHost}${img}` : img

  const hasConverted =
    ret.startsWith('https://www.notion.so/image') ||
    ret.includes('notion.site/images/page-cover/')

  const needConvert =
    !hasConverted &&
    (block?.type === 'bookmark' ||
      ret.includes('secure.notion-static.com') ||
      ret.includes('prod-files-secure') ||
      ret.startsWith('attachment'))

  if (needConvert && block?.id) {
    ret = `${siteConfig.notionHost}/image/${encodeURIComponent(ret)}?table=${type}&id=${block.id}`
  }

  return ret
}

// ── Property parsing ──────────────────────────────────────────────────

function parseProperties(
  id: string,
  value: Record<string, unknown>,
  schema: Record<string, { name?: string; type?: string }>,
): Post | null {
  const rawProperties = Object.entries(
    (value.properties as Record<string, unknown>) || {},
  )
  const exclude = new Set(['date', 'select', 'multi_select', 'person'])
  const props: Record<string, unknown> = { id }

  for (const [key, val] of rawProperties) {
    const field = schema[key]
    if (!field?.type) continue
    const name = field.name || key

    if (!exclude.has(field.type)) {
      props[name] = getTextContent(val as Parameters<typeof getTextContent>[0])
    } else if (field.type === 'date') {
      const dateProperty = getDateValue(
        val as Parameters<typeof getDateValue>[0],
      )
      if (dateProperty) {
        props[name] = {
          start_date: dateProperty.start_date,
          end_date: dateProperty.end_date,
          time_zone: dateProperty.time_zone,
        }
      }
    } else if (field.type === 'select' || field.type === 'multi_select') {
      const selects = getTextContent(val as Parameters<typeof getTextContent>[0])
      if (selects?.[0]?.length) {
        props[name] = selects.split(',')
      }
    }
    // person type intentionally skipped for MVP
  }

  // type/status/category are single-select → take first
  const type = Array.isArray(props.type) ? props.type[0] : (props.type as string) || ''
  const status = Array.isArray(props.status)
    ? props.status[0]
    : (props.status as string) || ''
  const category = Array.isArray(props.category)
    ? props.category[0]
    : (props.category as string) || ''

  const dateObj = props.date as { start_date?: string } | undefined
  const publishDate = new Date(
    dateObj?.start_date || (value.created_time as string) || Date.now(),
  ).getTime()

  const slug = (props.slug as string) || id
  const title = (props.title as string) || 'Untitled'
  const tags = Array.isArray(props.tags)
    ? (props.tags as string[])
    : props.tags
      ? [String(props.tags)]
      : []

  // Only care about rows with a slug for now
  if (!slug) return null

  const format = value.format as
    | { page_icon?: string; page_cover?: string }
    | undefined

  const href =
    type === 'Post'
      ? `/${siteConfig.postUrlPrefix}/${slug}`
      : `/${slug}`

  return {
    id,
    title,
    slug,
    href,
    type: type || 'Post',
    status: status || 'Published',
    category: category || undefined,
    tags,
    summary: (props.summary as string) || undefined,
    password: (props.password as string) || undefined,
    icon: mapImageUrl(format?.page_icon, { id, type: value.type as string }),
    pageCover: mapImageUrl(format?.page_cover, {
      id,
      type: value.type as string,
    }),
    publishDate,
    publishDay: formatDay(publishDate),
    lastEditedDate: new Date(
      (value.last_edited_time as string) || publishDate,
    ).getTime(),
  }
}

function formatDay(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Light block cleanup for react-notion-x ────────────────────────────

function normalizeBlockType(type: string): string {
  switch (type) {
    case 'heading_1':
      return 'header'
    case 'heading_2':
      return 'sub_header'
    case 'heading_3':
    case 'heading_4':
    case 'header_4':
      return 'sub_sub_header'
    default:
      return type
  }
}

function formatRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  const adapted = adapterBlockMap(recordMap)
  const blocks = adapted.block || {}

  for (const blockId of Object.keys(blocks)) {
    const entry = blocks[blockId] as { value?: Record<string, unknown> }
    const value = entry?.value
    if (!value) continue

    // strip crdt fields react-notion-x doesn't understand
    delete value.crdt_data
    delete value.crdt_format_version

    if (typeof value.type === 'string') {
      value.type = normalizeBlockType(value.type)
    }

    // language aliases for code blocks
    if (value.type === 'code') {
      const props = value.properties as
        | { language?: string[][] }
        | undefined
      const lang = props?.language?.[0]?.[0]
      if (lang === 'C++') props!.language![0][0] = 'cpp'
      if (lang === 'C#') props!.language![0][0] = 'csharp'
      if (lang === 'Assembly') props!.language![0][0] = 'asm6502'
    }

    // signed URLs for file/pdf/video/audio
    if (
      ['file', 'pdf', 'video', 'audio'].includes(value.type as string)
    ) {
      const props = value.properties as
        | { source?: string[][] }
        | undefined
      const src = props?.source?.[0]?.[0]
      if (
        src &&
        (src.startsWith('attachment') || src.includes('amazonaws.com'))
      ) {
        props!.source![0][0] =
          `https://notion.so/signed/${encodeURIComponent(src)}?table=block&id=${value.id}`
      }
    }
  }

  return adapted
}

// ── Public API ────────────────────────────────────────────────────────

async function fetchPage(pageId: string): Promise<ExtendedRecordMap> {
  const notion = getNotion()
  const recordMap = await notion.getPage(pageId)
  return formatRecordMap(recordMap)
}

/**
 * Load all published posts + pages from the Notion database.
 * Wrapped in React cache() for request-level dedup.
 */
export const getSiteData = cache(async (): Promise<SiteData> => {
  const pageId = idToUuid(siteConfig.notionPageId)
  const pageRecordMap = await fetchPage(pageId)

  let block = pageRecordMap.block || {}
  const rawMetadata = normalizeMetadata(block, pageId)

  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.error(
      `[notion] pageId "${pageId}" is not a database (type=${rawMetadata?.type})`,
    )
    return emptySiteData()
  }

  const collectionMap = pageRecordMap.collection || {}
  const inferredCollectionId =
    Object.keys(collectionMap).length === 1
      ? Object.keys(collectionMap)[0]
      : null
  const collectionId =
    (rawMetadata.collection_id as string) || inferredCollectionId
  const rawCollection =
    getRecordById(
      collectionMap as unknown as Record<string, unknown>,
      collectionId,
    ) || {}
  const collection = normalizeCollection(rawCollection)
  const schema = (collection.schema || {}) as Record<
    string,
    { name?: string; type?: string }
  >
  const viewIds = rawMetadata.view_ids as string[] | undefined

  const pageIds = getAllPageIds(
    pageRecordMap.collection_query,
    collectionId,
    pageRecordMap.collection_view,
    viewIds,
  )

  // Batch-fetch missing page blocks
  const missing = pageIds.filter((id) => !normalizePageBlock(block[id]))
  if (missing.length > 0) {
    const notion = getNotion()
    const batchSize = 30
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize)
      try {
        const chunk = await notion.getBlocks(batch)
        const adapted = adapterBlockMap({
          block: chunk?.recordMap?.block || {},
        } as ExtendedRecordMap)
        block = { ...block, ...adapted.block }
      } catch (err) {
        console.warn('[notion] batch fetch failed', err)
      }
    }
  }

  const all: Post[] = []
  for (const id of pageIds) {
    const pageBlock = normalizePageBlock(block[id])
    if (!pageBlock) continue
    // filter cross-database leakage
    if (collectionId && pageBlock.parent_id !== collectionId) {
      // also try without dashes
      const parentCompact = String(pageBlock.parent_id || '').replace(
        /-/g,
        '',
      )
      const collCompact = collectionId.replace(/-/g, '')
      if (parentCompact !== collCompact) continue
    }
    const post = parseProperties(id, pageBlock, schema)
    if (post) all.push(post)
  }

  // Published only for public listing
  const posts = all
    .filter((p) => p.type === 'Post' && p.status === 'Published')
    .sort((a, b) => b.publishDate - a.publishDate)

  const pages = all.filter(
    (p) => p.type === 'Page' && p.status === 'Published',
  )

  const tagSet = new Set<string>()
  const categorySet = new Set<string>()
  for (const p of posts) {
    p.tags.forEach((t) => tagSet.add(t))
    if (p.category) categorySet.add(p.category)
  }

  // Site title/description from collection metadata, fallback to config
  const siteTitle =
    (collection.name as string[][] | undefined)?.[0]?.[0] ||
    siteConfig.title
  const siteDescription =
    (collection.description as string[][] | undefined)?.[0]?.[0] ||
    siteConfig.description

  return {
    posts,
    pages,
    tags: [...tagSet].sort(),
    categories: [...categorySet].sort(),
    siteTitle,
    siteDescription,
  }
})

/**
 * Load a single post by slug, including full block map for rendering.
 */
export const getPost = cache(
  async (
    slug: string,
  ): Promise<(Post & { blockMap: ExtendedRecordMap }) | null> => {
    const { posts, pages } = await getSiteData()
    const meta =
      posts.find((p) => p.slug === slug) ||
      pages.find((p) => p.slug === slug)
    if (!meta) return null

    const blockMap = await fetchPage(meta.id)
    return { ...meta, blockMap }
  },
)

export const getAllPostSlugs = cache(async (): Promise<string[]> => {
  const { posts, pages } = await getSiteData()
  return [...posts, ...pages].map((p) => p.slug)
})

function emptySiteData(): SiteData {
  return {
    posts: [],
    pages: [],
    tags: [],
    categories: [],
    siteTitle: siteConfig.title,
    siteDescription: siteConfig.description,
  }
}
