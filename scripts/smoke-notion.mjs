import { NotionAPI } from 'notion-client'
import { idToUuid } from 'notion-utils'

const pageId = process.env.NOTION_PAGE_ID || 'c81f85bdae8c42138ba6180336517c69'
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

const uuid = idToUuid(pageId)
console.log('fetching', uuid)
const recordMap = await notion.getPage(uuid)
console.log('blocks', Object.keys(recordMap.block || {}).length)
console.log('collections', Object.keys(recordMap.collection || {}).length)
console.log(
  'collection_query keys',
  Object.keys(recordMap.collection_query || {}).length,
)

const root = recordMap.block?.[uuid]
console.log('root keys', root && Object.keys(root))
console.log('root sample', JSON.stringify(root, null, 2)?.slice(0, 600))

const collId = Object.keys(recordMap.collection || {})[0]
const coll = recordMap.collection?.[collId]
console.log('collId', collId)
console.log('collection sample', JSON.stringify(coll, null, 2)?.slice(0, 1000))

const cq = recordMap.collection_query?.[collId]
console.log('cq keys', cq && Object.keys(cq).slice(0, 5))
if (cq) {
  const firstView = Object.keys(cq)[0]
  console.log('first view', firstView)
  console.log(
    'view sample',
    JSON.stringify(cq[firstView], null, 2)?.slice(0, 800),
  )
}
