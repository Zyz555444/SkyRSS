# SkyRSS

在浏览器里管理订阅、阅读条目的 **RSS / Atom 阅读器**。界面采用玻璃拟态风格；拉取与解析在 **Next.js** 服务端完成，减少前端直连订阅源时的跨域与解析负担。

> **EN:** **SkyRSS (Glass RSS)** is an **RSS / Atom** reader that runs in the browser. It uses a glassmorphism UI, while feed fetching and XML parsing happen on the **Next.js** server to reduce CORS pain and keep parsing off the main thread.

---

## 截图 · Screenshots

| 桌面端（三栏） · Desktop (three columns) | 窄屏 / 移动端示意 · Narrow / mobile layout |
| --- | --- |
| ![SkyRSS 桌面端三栏布局 / Desktop three-column layout](docs/screenshot-desktop.png) | ![SkyRSS 窄屏布局 / Narrow-screen layout](docs/screenshot-mobile.png) |

---

## 功能 · Features

- **订阅**：粘贴 `http(s)` 的 RSS 或 Atom 地址即可添加；会先经接口校验，同一 URL 不会重复入库。
- **编辑**：重命名显示标题、删除订阅；输入框侧支持常见协议笔误修正（例如 `htts://` → `https://`）。
- **阅读**：左侧订阅、中间条目列表、右侧摘要与原文链接；中间列表可按条目的 **分类（categories）** 分组展示。
- **刷新**：对当前选中的订阅重新拉取。
- **持久化**：订阅列表保存在本机浏览器的 `localStorage`（见下文键名），刷新后保留。
- **正文 HTML（若源提供）**：服务端从 `content:encoded` 或 `content` 提取 HTML，经 **sanitize-html** 清洗后下发，长度有上限，避免响应过大。

> **EN:**
> - **Subscriptions:** paste an `http(s)` RSS or Atom URL; the app validates via the API first and avoids duplicate URLs.
> - **Editing:** rename the display title, remove feeds, and fix common typos like `htts://` → `https://`.
> - **Reading:** three-pane layout (feeds → items → snippet + open-original link); the item list can be **grouped by `categories`** when present.
> - **Refresh:** re-fetch the currently selected feed.
> - **Persistence:** feed list is stored in the browser’s `localStorage` (see key below); it survives reloads on the same origin.
> - **Article HTML (when available):** the server prefers `content:encoded` or `content`, sanitizes with **sanitize-html**, and caps size to keep responses reasonable.

---

## 技术栈 · Tech stack

| 类别 · Category | 选用 · Choice |
| --- | --- |
| 框架 · Framework | Next.js 16（App Router）、React 19 |
| 样式 · Styling | Tailwind CSS 4 |
| 订阅解析 · Feed parsing | [rss-parser](https://www.npmjs.com/package/rss-parser) |
| 校验 · Validation | Zod |
| HTML 清洗 · HTML sanitization | [sanitize-html](https://www.npmjs.com/package/sanitize-html) |

---

## 环境要求 · Requirements

建议使用 **Node.js 20 LTS** 或更高版本（与当前 Next.js 版本的支持范围一致）。

> **EN:** Use **Node.js 20 LTS** or newer (aligned with the supported range for the pinned Next.js version).

---

## 快速开始 · Quick start

```bash
npm install
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。

> **EN:** Open [http://localhost:3000](http://localhost:3000) in your browser.

### 脚本 · Scripts

| 命令 · Command | 说明 · Description |
| --- | --- |
| `npm run dev` | 本地开发 · Local development |
| `npm run build` | 生产构建 · Production build |
| `npm run start` | 启动生产服务（需先执行 `build`）· Start production server (after `build`) |
| `npm run lint` | ESLint |

---

## 部署到 Vercel · Deploy to Vercel

默认配置下 **无需填写环境变量**；`/api/rss` 在 Vercel 上以 Serverless/Edge 兼容的 Node 运行时执行出站 `fetch`，与本仓库逻辑一致。

> **EN:** **No environment variables** are required for the default setup. `/api/rss` performs outbound `fetch` on Vercel’s serverless runtime, matching this repo’s behavior.

1. **准备仓库**：将本仓库推送到 [GitHub](https://github.com/)（或 Vercel 支持的其它 Git 托管）。
2. **导入项目**：登录 [Vercel](https://vercel.com/) → **Add New…** → **Project** → **Import** 选中仓库。
3. **框架设置**：**Framework Preset** 选 **Next.js**（通常会自动检测）；**Root Directory** 保持仓库根目录（非 monorepo 无需改子目录）。
4. **构建命令**：**Build Command** 使用默认 `next build`；**Output Directory** 留空；**Install Command** 默认 `npm install` 即可。
5. **部署**：点击 **Deploy**；完成后使用 Vercel 提供的 `*.vercel.app` 域名访问。
6. **（可选）自定义域名**：在项目 **Settings → Domains** 中添加并校验你的域名。

> **EN:**
> 1. **Push your repo** to [GitHub](https://github.com/) (or another Git host Vercel supports).
> 2. **Import:** Vercel dashboard → **Add New…** → **Project** → **Import** the repository.
> 3. **Framework:** choose **Next.js** (usually auto-detected); **Root Directory** stays the repo root unless you use a monorepo subfolder.
> 4. **Build:** keep the default **`next build`**; leave **Output Directory** empty; **`npm install`** is fine for install.
> 5. **Ship:** click **Deploy**, then use the generated `*.vercel.app` URL.
> 6. **(Optional) Domains:** add your domain under **Settings → Domains** and complete DNS verification.

若生产环境拉取某些订阅源失败，多为远端对 **User-Agent**、IP 或 TLS 的限制，与是否部署在 Vercel 无关；可在界面查看返回的错误信息。

> **EN:** If some feeds fail only in production, it is often due to remote **User-Agent**, IP, or TLS policies—not specifically “because of Vercel”. Use the in-app error message to debug.

---

## HTTP API

### `GET /api/rss?url=<编码后的订阅地址>`

- 仅接受 **http** 或 **https** 的绝对地址；非法或空地址返回 `400`。
- 服务端请求订阅源：超时 **10 秒**；条目最多返回 **50** 条。
- 单条条目：`contentSnippet` 最多约 **2000** 字符；若存在全文 HTML，会先截断再清洗（上限约 **200,000** 字符），字段名为 `contentHtml`。
- 拉取或解析失败时返回 `502`，JSON 形如 `{ "error": "…" }`（含超时、远程状态码等说明）。

> **EN:** `GET /api/rss?url=<url-encoded feed URL>`
> - Only **http**/**https** absolute URLs; invalid input → **400**.
> - Server fetch timeout **10s**; at most **50** items.
> - Per item: `contentSnippet` is capped around **2000** chars; optional full HTML is clipped and sanitized (up to ~**200,000** chars) as `contentHtml`.
> - Fetch/parse failures → **502** with `{ "error": "…" }` (timeouts, upstream status, etc.).

---

## 本地数据 · Local data

订阅列表的存储键名为 **`rss-reader-feeds-v1`**。数据仅存于用户浏览器，不上传到本项目服务器；换浏览器或清除站点数据会丢失列表。

> **EN:** Feeds are stored under the **`rss-reader-feeds-v1`** `localStorage` key. Nothing is uploaded to “this app’s servers”; switching browsers or clearing site data drops the list.

---

## 仓库结构（摘要）· Repository layout

```
app/
  page.tsx                 # 首页，挂载阅读器 · Home, mounts reader
  api/rss/route.ts         # 订阅拉取与解析 API · Fetch + parse API
components/
  reader/ReaderApp.tsx      # 阅读器主界面与交互 · Main reader UI
  ui/glass*                 # 玻璃拟态 UI 组件 · Glass UI primitives
hooks/
  useFeeds.ts               # 订阅状态与 localStorage 同步 · Feed state + storage
lib/
  feeds-storage.ts          # 订阅持久化与 Zod 校验 · Persistence + Zod
  normalize-feed-url.ts     # 订阅 URL 规范化 · URL normalization
  sanitize-article-html.ts  # 条目 HTML 清洗 · HTML sanitization
types/
  rss.ts                    # API 返回相关类型 · API response types
```

---

## 已知限制 · Known limitations

- 部分站点会拦截非常见 **User-Agent**、要求登录、或返回非标准 XML，会导致拉取或解析失败；错误文案会显示在界面上。
- 本项目为单机阅读体验，无账号同步与云端备份。

> **EN:**
> - Some sites block uncommon **user agents**, require auth, or return non-standard XML—fetch/parse may fail with an on-screen message.
> - Single-device reading only: **no accounts** or cloud backup of your feed list.

---

## 面向贡献者与 Agent · Contributing & agents

本仓库使用的 Next.js 与公开文档中的习惯可能存在差异，修改路由、数据获取或构建相关代码前，请先阅读仓库根目录 **`AGENTS.md`**，并参考本地 **`node_modules/next/dist/docs/`** 中的说明。

> **EN:** This repo may follow **Next.js** behaviors that differ from older public docs. Before changing routing, data fetching, or build config, read **`AGENTS.md`** and the in-repo docs under **`node_modules/next/dist/docs/`**.
