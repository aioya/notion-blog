import type { ExtendedRecordMap } from 'notion-types'

export type PostStatus = 'Published' | 'Invisible' | string
export type PostType = 'Post' | 'Page' | string

export interface Post {
  id: string
  title: string
  slug: string
  href: string
  type: PostType
  status: PostStatus
  category?: string
  tags: string[]
  summary?: string
  password?: string
  icon?: string
  pageCover?: string
  publishDate: number
  publishDay: string
  lastEditedDate: number
  blockMap?: ExtendedRecordMap
}

export interface SiteData {
  posts: Post[]
  pages: Post[]
  tags: string[]
  categories: string[]
  siteTitle: string
  siteDescription: string
}

export type { ExtendedRecordMap }
