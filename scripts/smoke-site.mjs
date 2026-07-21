/**
 * Exercise the same extraction path as lib/notion.ts against the live DB.
 */
import { NotionAPI } from 'notion-client'
import { idToUuid, getTextContent, getDateValue } from 'notion-utils'

const pageIdRaw = process.env.NOTION_PAGE_ID || 'c81f85bdae8c42138ba6180336517c69'
const notion = new NotionAPI({
  apiBaseUrl: 'https://www.notion.so/api/v3',
  kyOptions: {
    hooks: {
      beforeRequest: [
        (request) => {
          const url = request.url.toString()
          if (url.includes('/api/v3/syncRecordValues')) {
            return new Request(
              url.replace(
                '/api/v3/syncRecordValues',
                '/api/v3/syncRecordValuesMain',
              ),
              request,
            )
          }
          return request
        },
      ],
    },
  },
})

function unwrapValue(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const inner = obj.value
  if (inner?.value && typeof inner.value === 'object') {
    const deep = inner.value
    if (deep.id && (inner.role !== undefined || deep.type || deep.schema)) {
      return deep
    }
  }
  if (inner?.id && obj.role !== undefined) return inner
  if (inner?.id) return inner
  if (inner?.schema) return inner
  return inner ?? obj
}

function toUuid(id) {
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

function idCandidates(id) {
  if (!id) return []
  return [...new Set([id, id.replace(/-/g, ''), toUuid(id), idToUuid(id)])]
}

function getRecordById(record, id) {
  if (!record || !id) return null
  for (const c of idCandidates(id)) {
    if (record[c]) return record[c]
  }
  return null
}

const uuid = idToUuid(pageIdRaw)
const recordMap = await notion.getPage(uuid)

// adapt blocks
const block = {}
for (const [id, b] of Object.entries(recordMap.block || {})) {
  block[id] = { value: unwrapValue(b) }
}
const collectionMap = {}
for (const [id, c] of Object.entries(recordMap.collection || {})) {
  collectionMap[id] = { value: unwrapValue(c) }
}

const root = block[uuid]?.value
console.log('root type', root?.type, 'collection_id', root?.collection_id)

const collectionId = root?.collection_id
const collRaw = getRecordById(collectionMap, collectionId)
let collection = collRaw
for (let i = 0; i < 3; i++) {
  if (!collection) break
  if (collection.schema || collection.value?.schema) break
  if (collection.value) collection = collection.value
  else break
}
// collection is { value: unwrapped } from map
collection = collection?.schema ? collection : collection?.value || collection
const schema = collection?.schema || {}
console.log(
  'schema fields',
  Object.values(schema).map((s) => s.name),
)

const viewIds = root?.view_ids || []
const targetViewId = viewIds[0]
const viewQuery = getRecordById(recordMap.collection_query, collectionId)
const selected = getRecordById(viewQuery, targetViewId)
const blockIds =
  selected?.collection_group_results?.blockIds ||
  selected?.results?.blockIds ||
  []
console.log('pageIds', blockIds.length)

// fetch missing
const missing = blockIds.filter((id) => !block[id]?.value?.properties)
console.log('missing blocks', missing.length)
if (missing.length) {
  const chunk = await notion.getBlocks(missing.slice(0, 50))
  for (const [id, b] of Object.entries(chunk?.recordMap?.block || {})) {
    block[id] = { value: unwrapValue(b) }
  }
}

const posts = []
for (const id of blockIds) {
  let page = block[id]?.value
  // peel
  for (let i = 0; i < 3 && page?.value; i++) page = page.value
  if (!page?.properties) continue
  if (page.parent_id && page.parent_id !== collectionId) {
    if (page.parent_id.replace(/-/g, '') !== collectionId.replace(/-/g, ''))
      continue
  }

  const props = { id }
  for (const [key, val] of Object.entries(page.properties || {})) {
    const field = schema[key]
    if (!field) continue
    const name = field.name
    if (['date', 'select', 'multi_select', 'person'].includes(field.type)) {
      if (field.type === 'date') {
        const d = getDateValue(val)
        if (d) {
          delete d.type
          props[name] = d
        }
      } else if (field.type === 'select' || field.type === 'multi_select') {
        const s = getTextContent(val)
        if (s?.[0]?.length) props[name] = s.split(',')
      }
    } else {
      props[name] = getTextContent(val)
    }
  }
  const type = Array.isArray(props.type) ? props.type[0] : props.type
  const status = Array.isArray(props.status) ? props.status[0] : props.status
  if (type === 'Post' && status === 'Published') {
    posts.push({
      title: props.title,
      slug: props.slug,
      type,
      status,
      tags: props.tags,
      category: Array.isArray(props.category)
        ? props.category[0]
        : props.category,
    })
  }
}

console.log('published posts', posts.length)
console.log(
  posts
    .slice(0, 10)
    .map((p) => `${p.slug || '?'} | ${p.title}`)
    .join('\n'),
)
