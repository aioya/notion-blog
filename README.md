# notion-blog

自研极简 Notion 博客：Next.js App Router + `notion-client` / `react-notion-x`。

复用与 NotionNext 相同的 Notion 数据库（默认 `c81f85bd…`），不依赖 NotionNext 框架。

## 技术栈

- Next.js 16（App Router, RSC, ISR）
- React 19 + TypeScript
- Tailwind CSS 4
- `notion-client` / `notion-utils` / `react-notion-x` 7.10
- `next-themes` 暗色模式 · `feed` RSS

## 快速开始

```bash
pnpm install
cp .env.example .env.local   # 按需修改 NOTION_PAGE_ID / SITE_URL
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 文章列表（第 1 页） |
| `/page/[n]` | 文章列表分页 |
| `/article/[slug]` | 文章正文（react-notion-x） |
| `/tag/[tag]`、`/tag/[tag]/page/[n]` | 标签筛选 + 分页 |
| `/category/[cat]`、`/category/[cat]/page/[n]` | 分类筛选 + 分页 |
| `/rss.xml` | RSS 2.0 |
| `/sitemap.xml` | Sitemap |
| `/robots.txt` | Robots |

每页条数默认 12，可用 `NEXT_PUBLIC_POSTS_PER_PAGE` 调整。

## Notion 约定

属性名需与 NotionNext 模板一致：

- `title` / `slug` / `type` / `status` / `category` / `tags` / `date` / `summary`
- `type=Post` + `status=Published` → 文章
- `type=Page` + `status=Published` → 独立页（导航栏展示）

数据库页面需公开（Share → Publish to web），无需 Integration Token。

## 脚本

```bash
pnpm dev      # 开发
pnpm build    # 生产构建（SSG + ISR）
pnpm start    # 启动生产服务
pnpm lint     # ESLint
```

## MVP 边界

不做：评论、统计、广告、全文搜索、多主题、多语言、Notion CONFIG 表覆盖。
