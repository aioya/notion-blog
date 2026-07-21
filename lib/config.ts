/**
 * Site identity — code-owned, not from Notion CONFIG tables.
 * Override via env for deploy-time customization.
 */

export const siteConfig = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || 'Aybrea',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '技术笔记与随笔',
  author: process.env.NEXT_PUBLIC_AUTHOR || 'Aybrea',
  bio: process.env.NEXT_PUBLIC_BIO || '一个普通的干饭人🍚',
  url: (
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ).replace(/\/$/, ''),
  lang: process.env.NEXT_PUBLIC_LANG || 'zh-CN',
  since: Number(process.env.NEXT_PUBLIC_SINCE || 2021),

  /** Notion database page id (public page, no token required) */
  notionPageId:
    process.env.NOTION_PAGE_ID || 'c81f85bdae8c42138ba6180336517c69',

  /** Unofficial Notion API base */
  notionApiBase:
    process.env.NOTION_API_BASE_URL || 'https://www.notion.so/api/v3',

  notionHost: process.env.NOTION_HOST || 'https://www.notion.so',

  /** URL prefix for posts → /article/[slug] */
  postUrlPrefix: process.env.NEXT_PUBLIC_POST_URL_PREFIX || 'article',

  /** ISR revalidate seconds */
  revalidate: Number(process.env.NEXT_PUBLIC_REVALIDATE_SECOND || 60),

  /** Which Notion database view to use (0 = first) */
  notionIndex: Number(process.env.NEXT_PUBLIC_NOTION_INDEX || 0),

  /** Posts per page on list views */
  postsPerPage: Number(process.env.NEXT_PUBLIC_POSTS_PER_PAGE || 12),
} as const

export type SiteConfig = typeof siteConfig
