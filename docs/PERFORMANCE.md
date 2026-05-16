# 性能优化指南

本文档记录了 SkyRSS 阅读器的性能优化策略和实现细节。

## 优化概览

### 1. 渲染性能优化

- **React.memo 优化**: 对列表项等频繁更新的组件使用 `React.memo` 进行浅比较，避免不必要的重渲染
- **useMemo/useCallback**: 对计算密集型操作和回调函数进行记忆化
- **组件拆分**: 将大型组件拆分为更小的、可独立优化的子组件

### 2. 滚动流畅度优化

- **虚拟滚动**: 使用 `useVirtualScroll` Hook 实现虚拟滚动，只渲染可见区域内的列表项
- **被动事件监听器**: 滚动事件使用 `{ passive: true }` 选项，避免阻塞滚动
- **CSS containment**: 对列表项使用 `contain: layout` 限制样式作用域
- **GPU 加速**: 对动画元素使用 `gpu-accelerated` 类，启用硬件加速

### 3. 网络请求优化

- **请求缓存**: 使用 `RequestCache` 类实现智能缓存，减少重复请求
- **缓存 TTL**: 默认 3 分钟缓存时间，平衡数据新鲜度和请求频率
- **请求合并**: 相同的并发请求会被自动合并，避免重复发送
- **空闲预取**: 使用 `prefetchOnIdle` 在浏览器空闲时预取可能需要的数据

### 4. 动画性能优化

- **CSS 动画优先**: 使用 CSS 动画而非 JavaScript 动画，利用 GPU 加速
- **will-change**: 适度使用 `will-change` 提示浏览器优化
- **requestAnimationFrame**: 对必须的 JS 动画使用 `requestAnimationFrame`
- **减少动画偏好**: 支持 `prefers-reduced-motion` 媒体查询

### 5. 加载状态优化

- **骨架屏**: 使用骨架屏动画替代传统的 Loading 转圈，提升感知性能
- **渐进式加载**: 内容分块加载，优先展示关键内容
- **乐观更新**: 对用户操作采用乐观更新策略，减少等待感知

## 使用方式

### 虚拟滚动列表

```tsx
import { ArticleListColumnOptimized } from "@/components/reader/ArticleListColumnOptimized";

// 替代原有的 ArticleListColumn
<ArticleListColumnOptimized
  rows={filteredRows}
  // ... 其他 props
/>
```

### 骨架屏加载

```tsx
import { ArticleListSkeleton, ArticleReaderSkeleton } from "@/components/ui/skeleton";

// 加载时显示骨架屏
{loading ? (
  <ArticleListSkeleton count={8} />
) : (
  <ul>{rows.map(row => <ListItem key={row.id} {...row} />)}</ul>
)}
```

### 缓存请求

```tsx
import { cachedFetch, createCacheKey } from "@/lib/cache";

// 自动缓存的 fetch
const data = await cachedFetch('/api/rss?url=xxx');

// 自定义缓存键
const key = createCacheKey('rss', feedId, page);
const data = await cachedFetch(url, options, key);
```

### 动画类

```tsx
// 淡入动画
<div className="animate-fade-in">内容</div>

// 列表项动画（带延迟）
<div className="animate-list-item" style={{ animationDelay: `${index * 50}ms` }}>
  列表项
</div>

// 骨架屏闪烁
<div className="skeleton w-32 h-8" />
```

## 性能监控

### 关键指标

- **FCP (First Contentful Paint)**: 目标 < 1.8s
- **LCP (Largest Contentful Paint)**: 目标 < 2.5s
- **TTI (Time to Interactive)**: 目标 < 3.8s
- **FPS**: 滚动时保持 60fps

### 测试方法

```bash
# Lighthouse 性能测试
npm run build && npx serve out

# Chrome DevTools Performance 面板
# 录制页面加载和滚动过程分析性能瓶颈
```

## 动画系统

### 动画类型

1. **页面过渡**: `animate-fade-in`, `animate-slide-in-left`, `animate-scale-in`
2. **列表项**: `animate-list-item` (带级联延迟)
3. **交互反馈**: `animate-button-press`, `hover:scale-110`
4. **骨架屏**: `skeleton` + `animate-shimmer`
5. **微动效**: `animate-float`, `animate-pulse-slow`

### 动画配置

所有动画使用统一的缓动函数：
```css
cubic-bezier(0.16, 1, 0.3, 1) /* 类似 iOS 的自然缓动 */
```

### 减少动画

系统自动检测用户的减少动画偏好：
```css
@media (prefers-reduced-motion: reduce) {
  /* 动画时长缩短至 0.01ms */
}
```

## 最佳实践

### ✅ 推荐

- 对长列表使用虚拟滚动
- 对静态内容使用 useMemo 缓存
- 对事件处理函数使用 useCallback
- 使用 CSS 动画替代 JS 动画
- 为图片等媒体资源添加尺寸属性

### ❌ 避免

- 避免在渲染函数中创建新对象/数组
- 避免过度使用 useEffect
- 避免在不必要的组件中使用 forwardRef
- 避免使用内联函数作为 key
- 避免在列表渲染中使用索引作为 key

## 后续优化方向

1. **图片懒加载**: 为 RSS 文章中的图片添加 IntersectionObserver 懒加载
2. **代码分割**: 使用 Next.js 的动态导入进行路由级代码分割
3. **Service Worker**: 添加离线缓存支持
4. **Web Workers**: 将 RSS 解析等 CPU 密集型任务移至 Worker
