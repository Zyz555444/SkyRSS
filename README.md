# SkyRSS

基于 **Next.js** 的在线 RSS 阅读器：玻璃拟态界面、在浏览器中管理订阅，并通过服务端接口拉取与解析订阅源。

## 功能概览

- **订阅管理**：添加 RSS/Atom 地址、重命名、删除；同一 URL 不会重复添加。
- **阅读布局**：左侧订阅列表，中间文章列表，右侧摘要与原文链接。
- **本地持久化**：订阅列表保存在浏览器 `localStorage`（键名 `rss-reader-feeds-v1`），刷新页面后保留。
- **服务端拉取**：`/api/rss?url=…` 在服务器侧请求订阅地址并解析 XML，减轻浏览器跨域限制；单次请求约 10 秒超时，最多返回 **50** 条条目。
- **地址规范化**：自动修正常见协议拼写错误（如 `htts://` → `https://`）。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16（App Router）、React 19 |
| 样式 | Tailwind CSS 4 |
| 解析 | [rss-parser](https://www.npmjs.com/package/rss-parser) |
| 校验 | Zod |

## 环境要求

建议使用 **Node.js 20 LTS** 或更高版本（与 Next.js 16 官方支持范围一致）。

## 快速开始

```bash
npm install
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 其他脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器（需先 `build`） |
| `npm run lint` | 运行 ESLint |

## 项目结构（摘要）

```
app/
  page.tsx              # 首页，挂载阅读器
  api/rss/route.ts      # GET：按 url 拉取并解析订阅
components/reader/
  ReaderApp.tsx         # 主界面与交互逻辑
hooks/
  useFeeds.ts           # 订阅列表状态（与 localStorage 同步）
lib/
  feeds-storage.ts      # 订阅持久化与 Zod 校验
  normalize-feed-url.ts # URL 规范化
types/
  rss.ts                # API 返回类型
```

## 使用说明

1. 在「添加订阅」中粘贴 **http(s)** 的 RSS 或 Atom 地址，回车或点击「添加订阅」；会先请求校验，成功后再写入列表。
2. 点击订阅可加载该源文章；「刷新当前源」重新拉取。
3. 点击文章在中间列表高亮，右侧显示摘要（若有）与「在浏览器中打开原文」。

## 已知限制

- 若目标站点封禁非常见 User-Agent、要求登录或返回非标准内容，拉取可能失败；错误信息会显示在界面中。
- 摘要长度在 API 层对 `contentSnippet` 做了截断，避免响应过大。

## 相关文档

- 本项目使用较新的 Next.js 行为，开发前可查阅仓库内 `node_modules/next/dist/docs/` 中的官方说明（见仓库 `AGENTS.md` 提示）。
